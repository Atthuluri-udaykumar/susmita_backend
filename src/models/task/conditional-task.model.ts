import { ITask } from "./task.interface";
import { TaskRequest } from "./task-request.model";
import { TaskResponse } from "./task-response.model";
import { ReplaceResponseType, TaskRequestUtils } from "../../utils/task-request.utils";
import * as _ from "lodash"
import { TaskResponseUtils } from "../../utils/task-response.utils";
import { Task } from "./task.model";
import { isEmptyObject } from "../../utils/model.util";

export interface IProcessingQRecord {
  trackingId: string;
  taskRequest: TaskRequest;
  taskResponse: TaskResponse;
  meetsCriteria: boolean;
  processed: boolean;
  hasError: boolean;
  result: any;
  error: any;
}
export interface IConditionalTaskResponse {
  taskId: string,
  reqTrackerKey: string;
  reqTrackingId: string;
  skippedProcessing: boolean;
  processed: boolean;
  results: any[];
  errors: any[];
}

export interface ConditionalTaskProcessingStatus { 
  taskId: string;
  skippedProcessing?: boolean;
  processed?: boolean;
  results?: any[];
  errors?:any[];
}
// ConditionalTask: Only process record(s) within a list of records which satisfy the given condition/criteria
export class ConditionalTask extends Task{
  /* MULTI-ROW Processing 
    --------------------------------
    Applies when the taskNode that this task belongs to has been configured with .processMany == true
    Used internally for storing multiple instances of the same request. 
    There's a 1:1 mapping between:
       # of parent-taskNode response rows being processed [to] # of request stored here. 
  */
  private processingQ: Map<string, IProcessingQRecord>;

  constructor(
    key: string,
    taskRequest: TaskRequest = new TaskRequest(),
    dataResolver: any,
    allowMany = true, // set to false if expecting a single unique record
    requestTrackerKey = '' //uses the key against the parent data record object to get to the unique id such as: prsnId, accountId
  ) {
      super(key, taskRequest, dataResolver, allowMany, requestTrackerKey);

      this.processingQ = new Map<string, IProcessingQRecord>();
  }

  allowProcessingCriteria(parentDataRec?: any): boolean {
    return true;//DEFAULT: always process a request
  }
  updateRequestBody(parentDataRecord: any, requestBody?: any): any {
    return requestBody? requestBody: parentDataRecord;//DEFAULT: return request-body back.
  }

  //Replace request object with corresponding values from parent-data
  async preProcess(parentResponseData?: any, parentRequestData?: any, processMany: boolean = false): Promise<any> {
    if(parentResponseData){
      if(processMany && Array.isArray(parentResponseData)){
        //console.log({'loc': `preProcess[${this.key}]-MULTI`, 'pData': parentResponseData.length, 'reqQ': this.processManyReqQ.length});

        for(let pDataRec of parentResponseData){
          //Transform originial parent data record
          const requestedRecord : IProcessingQRecord = {
            trackingId: pDataRec[this.requestTrackerKey] as string, 
            taskRequest: _.cloneDeep(this.taskRequest),
            meetsCriteria: this.allowProcessingCriteria(pDataRec),
            processed: false,
            taskResponse: new TaskResponse(pDataRec[this.requestTrackerKey]),
            result: {},
            error: {},
            hasError: false
          };

          //Add to Queue
          this.processingQ.set(requestedRecord.trackingId, requestedRecord);

          if(requestedRecord.meetsCriteria){//Does request data satisfy the criteria for it to be processed by this Task?
            let urlResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, pDataRec, false);
            //console.log({'loc': `preProcess-MULTI[${requestedRecord.trackingId}]`, 'pData': pDataRec, 'replace': urlResponse, 'status': urlResponse.success});
            if(urlResponse.success){
              requestedRecord.taskRequest.url = urlResponse.data; //request payload transformed to this specific record
              //console.log({'loc': `preProcess[${this.key}]-MULTI[${requestedRecord.trackingId}]-PASS`, 'reqQ': this.processingQ.size});
              if(['POST', 'PUT', 'DELETE'].indexOf(this.taskRequest.method) > -1){
                if(this.taskRequest.body && !isEmptyObject(this.taskRequest.body)){
                  const bodyResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, pDataRec, true);
                  //console.log({'loc': `preProcess[${this.key}]-MULTI[${requestedRecord.trackingId}]-[${this.taskRequest.method}]`, 'bodyResonse': JSON.stringify(bodyResponse)});
                  if(bodyResponse.success){
                    requestedRecord.taskRequest.body = JSON.parse(bodyResponse.data);
                  } else {
                    requestedRecord.error = bodyResponse.error;
                    requestedRecord.hasError = true;
                  }
                } else {
                  /*If the body was left empty at the time of declaration, say some properties in the object payload has to change based on certain condition, 
                  then the Task can do overwrite it
                  */
                  requestedRecord.taskRequest.body = this.updateRequestBody(pDataRec);
                }
              }
            } else {
              //console.log({'loc': `preProcess-MULTI[${reqQIdx}]-FAIL`, 'req-Q':  this.processManyReqQ[reqQIdx-1]});
              requestedRecord.error = urlResponse.error;
              requestedRecord.hasError = true;
            }
          } 
        }
      } else { //Single request processing
        //console.log({'loc': 'preProcess-SINGL', 'request': this.taskRequest, 'processMany': processMany});

        const urlResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, parentResponseData, false);
        if(urlResponse.success){
          this.taskRequest.url = urlResponse.data;
          if(['POST', 'PUT', 'DELETE'].indexOf(this.taskRequest.method) > -1){
            const bodyResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, parentResponseData, true);
            if(bodyResponse.success){
              this.taskRequest.body = JSON.parse(bodyResponse.data);
            } else {
              this.taskResponse.status = 200;
              this.taskResponse.errors.push(bodyResponse.error);
              return Promise.reject(this.taskResponse);
            }
          }
        } else {
          this.taskResponse.status = 200;
          this.taskResponse.errors.push(urlResponse.error);
          return Promise.reject(this.taskResponse);
        }
      }
    } else if(parentRequestData){//applies to failover node 
      //console.log({'loc': 'preProcess-FAILOVR', 'request': this.taskRequest, 'processMany': processMany});

      const urlResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, parentRequestData, false);
      if(urlResponse.success){
        this.taskRequest.url = urlResponse.data;
        if(['POST', 'PUT', 'DELETE'].indexOf(this.taskRequest.method) > -1){
          const bodyResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, parentRequestData);
          if(bodyResponse.success){
            this.taskRequest.body = JSON.parse(bodyResponse.data);
          } else {
            this.taskResponse.status = 200;
            this.taskResponse.errors.push(bodyResponse.error);
            return Promise.reject(this.taskResponse);
          }
        } 
      } else {
        this.taskResponse.status = 200;
        this.taskResponse.errors.push(urlResponse.error)
        return Promise.reject(this.taskResponse);
      } 
    } else { //applies to root node 
      //console.log({'loc': 'preProcess-ROOT', 'request': this.taskRequest, 'processMany': processMany});

      const urlResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, null, false , true);
      if(urlResponse.success){
        this.taskRequest.url = urlResponse.data;
        if(['POST', 'PUT', 'DELETE'].indexOf(this.taskRequest.method) > -1){
          const bodyResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, null, true, true);
          if(bodyResponse.success){
            this.taskRequest.body = JSON.parse(bodyResponse.data);
          }
        }
      }
    }
    return Promise.resolve(this);
  }

  /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Should be self-contained !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    i.e. Handle all valid, invalid data scenarios and Exceptions
    Always return a Promise in resolved or rejected status
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Should be self-contained !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
  async process(parentResponse?: any, processMany: boolean = false): Promise<any> {
    try {
      if(processMany){
        if(this.processingQ?.size > 0){
            //Create promises for each request in Q which have passed criteria and have no errors
            const taskReqPromises: Promise<TaskResponse>[] 
            = Array.from(this.processingQ.values())
                .filter((taskReq: IProcessingQRecord) => (!taskReq.hasError && taskReq.meetsCriteria))
                .map((taskReq: IProcessingQRecord) => {
                  //console.log({'loc': `CONDITIONAL-TASK[${this.key}]-process[b4]-Multi[${taskReq.trackingId}]`, 'req': taskReq.taskRequest.url});
                  return TaskRequestUtils.processConditionalTaskRequest(
                                            taskReq.trackingId, 
                                            taskReq.taskRequest, 
                                            this.dataResolver, 
                                            this.allowMany
                                          );
                });
          
            //Transform responses for each of the resolved promises
            let rspResults: IProcessingQRecord[] 
            = (await Promise.allSettled(taskReqPromises))
                .map((rsp, idx) => {
                  let processedRecord = {} as IProcessingQRecord;
                  if (rsp.status === 'fulfilled') { //we always expect a resolved promise
                    const taskRsp = rsp.value as TaskResponse;
                    processedRecord = this.processingQ.get(taskRsp.trackingId)|| {} as IProcessingQRecord;
                    processedRecord.processed = true;
                    processedRecord.taskResponse = taskRsp;
                    processedRecord.result = taskRsp.result? taskRsp.result: {};
                    processedRecord.hasError = taskRsp.errors && taskRsp.errors.length>0;
                    processedRecord.error = processedRecord.hasError? taskRsp.errors.at(0): {};
                    //console.log({'CONDITIONAL-TASK[on-fulfill] RSP': JSON.stringify(taskRsp), 'PROCQ-RSP': processedRecord});
                  } 
                  return processedRecord;
                });

            this.taskResponse = TaskResponseUtils.handleValidDataResponseV2(
                                            this.key,
                                            Array.from(this.processingQ.values()));
            
            /*console.log({'loc': `CONDITIONAL-TASK[${this.key}-process-Multi-FINAL`, 
                      'response': JSON.stringify(this.taskResponse),
                      'rspResults': JSON.stringify(rspResults),
                      'processingQ': this.processingQ.values()
                    });*/
        } 
      } else {//Single request processing
        this.taskResponse = await TaskRequestUtils.processTaskRequest(this.taskRequest, this.dataResolver, this.allowMany);
      }

      return Promise.resolve(this);
    } catch (error: any) {
      this.taskResponse.status = 500;
      this.taskResponse.errors.push((error.message ??= 'Unknown error message'));
      return Promise.resolve(this);
    }
  }

  /*
  currently nothing: used for transforming data
  */
  async postProcess(taskResponse: TaskResponse, parentData?: any, processMany: boolean = false): Promise<any> {
    if(parentData) {
      //do something with parent data
    }

    this.taskResponse =  taskResponse;
    return Promise.resolve(this);
  }
  
}