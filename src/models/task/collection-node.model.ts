import { cloneDeep, groupBy } from 'lodash';
import { ITaskNode } from './task-node.interface';
import { TaskResponse } from './task-response.model';
import { Task } from './task.model';
import { TaskNode } from './task-node.model';
import { TaskResponseUtils } from '../../utils/task-response.utils';
import { TaskRequest } from './task-request.model';

/*
    Collection Node Processing : collects info. for each record within a set of records in parallel
    -----------------------------------------------------------------------------------------------
    It doesn't have any task of its own, instead forks out task listed inside collectionTasks.
    Join results (merge by key) from each of the task responses

    IMPORTANT: 
    Each forked task is expected to output it's response data type(V) in the same format as the incoming parent node's response data type(V) 
*/
export class CollectionNode<T extends Task, V extends Record<string, any>> extends TaskNode<T> {
  protected collectionTasks: T[];
  private responseDataMergeKey: string;

  constructor(taskKey: string, responseDataMergeKey = '', ...collectionTasks: T[]) {
    super(new Task( taskKey, new TaskRequest(), null) as T, 
          false, //default: failoverNode false
          '', 
          true);//default: processMany true
    this.parent = null;
    this.collectionTasks = collectionTasks;
    this.responseDataMergeKey = responseDataMergeKey;
  }

  /*
    Parse out data from parent-node task for setting request parameter[s]/body
  */
  async preProcess(): Promise<ITaskNode> {
    //console.log('Collect-preProcess[' + this.task.key + '] ' + this.task.taskRequest.url);
    try{
      if (this.parent && this.parent.task && this.parent.task.taskResponse.hasData()) {
        const pData = 
        Array.isArray(this.parent.task.taskResponse.result) && this.parent.task.taskResponse.result.length > 0 && !this.parent.task.allowMany
        ? this.parent.task.taskResponse.result[0]
        : this.parent.task.taskResponse.result;

        await Promise.allSettled(
          this.collectionTasks.map((task: T) => {
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
    //console.log('Collect-Process[' + this.task.key + '] ' + this.task.taskRequest.url);
    if (this.parent && this.parent.task && this.parent.task.taskResponse.hasData()) {
      const pData =
      Array.isArray(this.parent.task.taskResponse.result) && this.parent.task.taskResponse.result.length > 0 && !this.parent.task.allowMany
          ? this.parent.task.taskResponse.result[0]
          : this.parent.task.taskResponse.result;

      await Promise.allSettled(
        this.collectionTasks.map((task: T) => {
          return task.process(cloneDeep(pData), this.processMany);
        })
      );
    } 
    return this;
  }

  async postProcess(): Promise<TaskNode<T>> {
    //console.log('Collect-postProcess[' + this.task.key + '] ' + this.task.taskRequest.url);
    if (this.parent && this.parent.task && this.parent.task.taskResponse.hasData()) {
      const pData =
      Array.isArray(this.parent.task.taskResponse.result) && this.parent.task.taskResponse.result.length > 0 && !this.parent.task.allowMany
          ? this.parent.task.taskResponse.result[0]
          : this.parent.task.taskResponse.result;
      
      const taskResponses = (
          await Promise.allSettled(
                  this.collectionTasks.map((task: T) => {
                    return task.postProcess(task.taskResponse, cloneDeep(pData), this.processMany);
                  })
                )).map((rsp) => {
                  if (rsp.status === 'fulfilled') {
                    const taskRsp = rsp.value.taskResponse as TaskResponse;
                    if(taskRsp.hasData()){
                      return taskRsp.result;
                    }
                    //return rsp.value;
                  } 
                });
      
      //console.log({'Collect-PP-taskResponse': JSON.stringify(taskResponses)});
      this.task.taskResponse = TaskResponseUtils.handleValidDataResponse(
                                  TaskResponseUtils.mergeResponses<V>(this.responseDataMergeKey, 
                                                                      [...taskResponses])
                               );
      //console.log({'Collect-PP-mergedRsp': JSON.stringify(this.task.taskResponse)});
    } 
    return this;
  }

}