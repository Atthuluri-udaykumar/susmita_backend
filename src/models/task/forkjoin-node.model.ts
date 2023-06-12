import { cloneDeep } from 'lodash';
import { ITaskNode } from './task-node.interface';
import { TaskResponse } from './task-response.model';
import { Task } from './task.model';
import { TaskNode } from './task-node.model';
import { TaskResponseUtils } from '../../utils/task-response.utils';
import { TaskRequest } from './task-request.model';

/*
    Fork Join Node Processing 
    --------------------------------
    It doesn't have any task of its own, instead forks out task listed inside mergedNodes
    Join results (merge by key) from each of the task responses
*/
export class ForkJoinNode<T extends Task, V extends Record<string, any>> extends TaskNode<T> {
  protected mergeTasks: T[];

  constructor(taskKey: string, processMany = false, ...mergeTasks: T[]) {
    super(new Task( taskKey, new TaskRequest(), null) as T, 
          false, 
          '', 
          processMany);
    this.parent = null;
    this.mergeTasks = mergeTasks;
  }

  /*
    Parse out data from parent-node task for setting request parameter[s]/body
  */
  async preProcess(): Promise<ITaskNode> {
    //console.log('forkJoin-preProcess[' + this.task.key + '] ' + this.task.taskRequest.url);
    try{
      if (this.parent && this.parent.task && this.parent.task.taskResponse.hasData()) {
        const pData = 
        Array.isArray(this.parent.task.taskResponse.result) && this.parent.task.taskResponse.result.length > 0 && !this.parent.task.allowMany
        ? this.parent.task.taskResponse.result[0]
        : this.parent.task.taskResponse.result;

        await Promise.allSettled(
          this.mergeTasks.map((task: T) => {
            return task.preProcess(cloneDeep(pData), null, this.processMany);
          })
        );
      } 
      return this;
    } catch(errorTask){
      const errorResponse = errorTask as TaskResponse;
      this.task.taskResponse.errors = errorResponse.errors;
      this.task.taskResponse.status = errorResponse.status;
      return Promise.reject(this);
    }
  }

  async process(): Promise<any> {
    //console.log('forkJoin-Process[' + this.task.key + '] ' + this.task.taskRequest.url);
    if (this.parent && this.parent.task && this.parent.task.taskResponse.hasData()) {
      const pData =
      Array.isArray(this.parent.task.taskResponse.result) && this.parent.task.taskResponse.result.length > 0 && !this.parent.task.allowMany
          ? this.parent.task.taskResponse.result[0]
          : this.parent.task.taskResponse.result;

      await Promise.allSettled(
        this.mergeTasks.map((task: T) => {
          return task.process(cloneDeep(pData), this.processMany);
        })
      );
    } 
    return this;
  }

  async postProcess(): Promise<TaskNode<T>> {
    //console.log('forkJoin-postProcess[' + this.task.key + '] ' + this.task.taskRequest.url);
    if (this.parent && this.parent.task && this.parent.task.taskResponse.hasData()) {
      const pData =
      Array.isArray(this.parent.task.taskResponse.result) && this.parent.task.taskResponse.result.length > 0 && !this.parent.task.allowMany
          ? this.parent.task.taskResponse.result[0]
          : this.parent.task.taskResponse.result;
      
      const taskResponses = (
                await Promise.allSettled(
                        this.mergeTasks.map((task: T) => {
                          return task.postProcess(task.taskResponse, cloneDeep(pData), this.processMany);
                        })
                )).map((rsp) => {
                        if (rsp.status === 'fulfilled') return rsp.value;
                        else return rsp.reason;
                      });

      const orderedResults = new Array<V[]>(this.mergeTasks.length);
      if(Array.isArray(taskResponses) && taskResponses.length>1){
        this.mergeTasks.forEach((task: T, idx) => {
          taskResponses.forEach((taskR) => {
            //console.log({'forkJoin-PP-responses': JSON.stringify(taskR.taskResponse)});

            if((taskR.key === task.key) && (taskR.taskResponse.hasData())) {
              orderedResults[idx] = taskR.taskResponse.result;
            }
          })
        });
      }

      this.task.taskResponse = TaskResponseUtils.handleValidDataResponse(
                                  TaskResponseUtils.mergeResponses<V>('prsnId', [...orderedResults])
                                );
      //console.log({'forkJoin-PP-mergedRsp': JSON.stringify(this.task.taskResponse)});
    } 
    return this;
  }

}