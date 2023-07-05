import { cloneDeep, groupBy } from 'lodash';
import { ITaskNode } from './task-node.interface';
import { TaskResponse } from './task-response.model';
import { Task } from './task.model';
import { TaskNode } from './task-node.model';
import { TaskResponseUtils } from '../../utils/task-response.utils';
import { TaskRequest } from './task-request.model';
import { ConditionalTask, IConditionalTaskResponse } from './conditional-task.model';

interface IConditionalTask<T extends ConditionalTask> {
  onPassCriteria: boolean;
  task: T;
}

/*
  Decision Node Processing : Seperates records into 2 sets based on them satisfying the given decision criteria for further processing
  --------------------------------------------------------------------------------------------------------------------------------------
  The ones that satisfy the criteria/condition are processed by onTrue conditional tasks
  The ones that don't satisfy the criteria/condition are processed by onFalse conditional tasks
  
  It doesn't have any task of its own, instead forks out task listed inside conditionalTasks.
  Join results (responseDataMergeKey) from each of the task responses

  IMPORTANT: Each forked task is expected to output it's response data type(V) in the same format 
            as the incoming parent node's response data type(V) 
*/
export class DecisionNode<T extends ConditionalTask, V extends Record<string, any>> extends TaskNode<T> {
  protected conditionalTasks: IConditionalTask<T>[];
  private responseDataMergeKey: string;
  private onTrueTaskRequestDataQ:V[] = [];//Parent Data records that satisfy the decisionCriteria provided
  private onFalseRequestDataQ:V[] = [];

  constructor(taskKey: string, responseDataMergeKey = '', ...conditionalTasks: IConditionalTask<T>[]) {
    super(
      new Task(taskKey, new TaskRequest(), null) as T, 
      false, //default: failoverNode false 
      '', 
      true //default: processMany true
    );

    this.parent = null;
    this.conditionalTasks = conditionalTasks;
    this.responseDataMergeKey = responseDataMergeKey;
  }

  /* 
    Data filter criteria
    -----------------------------------------------------------------
    Does [Parent Data records that satisfy this decisionCriteria]
      --> send them to onTrue conditional tasks[found in conditionalTask having status=true]
    ELSE
      --> send them to onFalse conditional tasks[found in conditionalTask having status=false]
  */
  public decisionCriteria(parentDataRecord?: any): boolean {
    return true;//DEFAULT: always treat a request as having passed filter-criteria
  }

  /*
    Creates a list of promises for a certain stage:preProcess/process/postProcess 
    based on request Q.
  */
  private fetchConditionalTaskPromises(stage: string): Promise<any>[] {
    let conditionalTaskPromises: Promise<any>[] = new Array<Promise<any>>();

    if((this.onTrueTaskRequestDataQ.length > 0) && (this.onFalseRequestDataQ.length > 0)){
        conditionalTaskPromises = 
              this.conditionalTasks
                  .filter((condTask: IConditionalTask<T>) => condTask.onPassCriteria === true)
                  .map((onTrueTask: IConditionalTask<T>) => {
                    if(stage === 'preProcess'){
                      return onTrueTask.task.preProcess(cloneDeep(this.onTrueTaskRequestDataQ), null, this.processMany);
                    } else if(stage === 'process'){
                      return onTrueTask.task.process(cloneDeep(this.onTrueTaskRequestDataQ), this.processMany);
                    } else {
                      return onTrueTask.task.postProcess( onTrueTask.task.taskResponse,
                                                          cloneDeep(this.onTrueTaskRequestDataQ), this.processMany);
                    }
                  })
                  .concat(this.conditionalTasks
                            .filter((condTask: IConditionalTask<T>) => condTask.onPassCriteria === false)
                            .map((onFalseTask: IConditionalTask<T>) => {
                              if(stage === 'preProcess'){
                                return onFalseTask.task.preProcess(cloneDeep(this.onFalseRequestDataQ), null, this.processMany);
                              } else if(stage === 'process'){
                                return onFalseTask.task.process(cloneDeep(this.onFalseRequestDataQ), this.processMany);
                              } else {
                                return onFalseTask.task.postProcess(onFalseTask.task.taskResponse, 
                                                                    cloneDeep(this.onFalseRequestDataQ), this.processMany);
                              }
                          })
              );
      } else if(this.onTrueTaskRequestDataQ.length > 0) {
        conditionalTaskPromises = 
              this.conditionalTasks
                  .filter((condTask: IConditionalTask<T>) => condTask.onPassCriteria === true)
                  .map((onTrueTask: IConditionalTask<T>) => {
                    if(stage === 'preProcess'){
                      return onTrueTask.task.preProcess(cloneDeep(this.onTrueTaskRequestDataQ), null, this.processMany);
                    } else if(stage === 'process'){
                      return onTrueTask.task.process(cloneDeep(this.onTrueTaskRequestDataQ), this.processMany);
                    } else {
                      return onTrueTask.task.postProcess( onTrueTask.task.taskResponse,
                                                          cloneDeep(this.onTrueTaskRequestDataQ), this.processMany);
                    }
                  });
      } else if(this.onFalseRequestDataQ.length > 0) {
        conditionalTaskPromises = 
              this.conditionalTasks
              .filter((condTask: IConditionalTask<T>) => condTask.onPassCriteria === false)
              .map((onFalseTask: IConditionalTask<T>) => {
                if(stage === 'preProcess'){
                  return onFalseTask.task.preProcess(cloneDeep(this.onFalseRequestDataQ), null, this.processMany);
                } else if(stage === 'process'){
                  return onFalseTask.task.process(cloneDeep(this.onFalseRequestDataQ), this.processMany);
                } else {
                  return onFalseTask.task.postProcess(onFalseTask.task.taskResponse, 
                                                      cloneDeep(this.onFalseRequestDataQ), this.processMany);
                }
            });
      }
      
      /*console.log({'fetchConditionalTaskPromises' : `[${stage}]` + this.task.key + ' ' + this.task.taskRequest.url,
              'onTrueTaskRequestDataQ': this.onTrueTaskRequestDataQ.length,
              'onFalseRequestDataQ': this.onFalseRequestDataQ.length,
              'Promise-Q-Length': conditionalTaskPromises.length
            });*/

    return conditionalTaskPromises;
  }

  
  /*
    Parse out data from parent-node task for setting request parameter[s]/body
  */
  async preProcess(): Promise<ITaskNode> {
    //console.log('DecisionNode-preProcess[' + this.task.key + '] ' + this.task.taskRequest.url);
    try{
      if (this.parent && this.parent.task && this.parent.task.taskResponse.hasData()) {
        const pData = 
        Array.isArray(this.parent.task.taskResponse.result) && this.parent.task.taskResponse.result.length > 0 && !this.parent.task.allowMany
        ? this.parent.task.taskResponse.result[0]
        : this.parent.task.taskResponse.result;

        //Filter parent data record for yesTasks and noTasks
        for(let pDataRec of pData){
          if(this.decisionCriteria(pDataRec)){
            this.onTrueTaskRequestDataQ.push(pDataRec);
          } else {
            this.onFalseRequestDataQ.push(pDataRec);
          }
        }

        if(this.processMany && Array.isArray(pData)){
          await Promise.allSettled(this.fetchConditionalTaskPromises('preProcess'));
        }
      } 
      return this;
    } catch(errorTask){
      const errorResponse = errorTask as TaskResponse;
      this.task.taskResponse.errors = errorResponse.errors;
      this.task.taskResponse.status = errorResponse.status;
      return Promise.reject(this);
    }
  }
  
  /*
    Concurrently Process all conditional tasks
  */
  async process(): Promise<any> {
    if (this.parent && this.parent.task && this.parent.task.taskResponse.hasData()) {
      await Promise.allSettled(this.fetchConditionalTaskPromises('process'));
    } 
    return this;
  }
    
  /*
    Concurrently POST-Process all conditional tasks, and reduce TaskResponses from each into a single response.
  */
  async postProcess(): Promise<TaskNode<T>> {
    //console.log('DecisionNode-postProcess[' + this.task.key + '] ' + this.task.taskRequest.url);
    if (this.parent && this.parent.task && this.parent.task.taskResponse.hasData()) {
      const taskResponses = 
      (await Promise.allSettled(this.fetchConditionalTaskPromises('postProcess')))
        .map((rsp) => { //TRANSFORM                                    
          if (rsp.status === 'fulfilled') {
            const conditionalTaskResults: IConditionalTaskResponse[] = new Array<IConditionalTaskResponse>();
            const condTaskRsp = rsp.value.taskResponse as TaskResponse;
            /*console.log({'DecisionNode-Process': condTaskRsp,
                        'result': condTaskRsp.hasData()? condTaskRsp.result: {},
                        'err': condTaskRsp.hasError()? condTaskRsp.errors: {},
                      });*/
            if(condTaskRsp.hasData()){
              if(Array.isArray(condTaskRsp.result)){
                condTaskRsp.result.forEach(rslt => {
                  const taskResult: IConditionalTaskResponse = {} as IConditionalTaskResponse;
                  //console.log({'DECISION-NODE[postPorcess] RSLT': JSON.stringify(rslt)});
                  taskResult.taskId = condTaskRsp.trackingId;
                  taskResult.reqTrackerKey = this.responseDataMergeKey;
                  taskResult.reqTrackingId = rslt.trackingId;
                  taskResult.skippedProcessing = !rslt.meetsCriteria;
                  taskResult.processed = rslt.processed;
                  taskResult.results = new Array<any>();
                  taskResult.errors = new Array<any>();
                  if(rslt.meetsCriteria){
                    if(rslt.hasError){
                      taskResult.errors.push(rslt.error);
                    } else{
                      taskResult.results.push(rslt.result);
                    }
                  }
                  conditionalTaskResults.push(taskResult);
                });
              }
            } else  {
              const taskResult: IConditionalTaskResponse = {} as IConditionalTaskResponse;
              taskResult.taskId = rsp.value.taskResponse.trackingId;
              taskResult.reqTrackerKey = this.responseDataMergeKey;
              taskResult.errors.push(rsp.value.taskResponse.errors);
              conditionalTaskResults.push(taskResult);
            }

            return conditionalTaskResults;
          } 
        })
        .flat(1)//Flatten array of arrays into a single array
        .map((rsp) => {//Transform object by reqTrackerKey
          const taskRsp = rsp as IConditionalTaskResponse;
          return {
            [taskRsp.reqTrackerKey]: taskRsp.reqTrackingId,
            taskId: taskRsp.taskId,
            skippedProcessing: taskRsp.skippedProcessing,
            processed: taskRsp.processed,
            results: taskRsp.results,
            errors: taskRsp.errors
          };
        });
      
      //Group task status info by the merge-key
      const groupByMergeKey = groupBy(taskResponses, this.responseDataMergeKey);
      
      this.task.taskResponse = 
        TaskResponseUtils.handleValidDataResponseV2(this.task.key, 
          Object.keys(groupByMergeKey).map(key => (
            { 
              [this.responseDataMergeKey]: key, 
              taskActionStatuses: groupByMergeKey[key] 
            }))
        );                              
      //console.log({'DecisionNode-PP-mergedRsp': JSON.stringify(this.task.taskResponse)});
    } 
    return this;
  }
}