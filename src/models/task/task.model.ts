import { ITask } from "./task.interface";
import { TaskRequest } from "./task-request.model";
import { TaskResponse } from "./task-response.model";
import { ReplaceResponseType, TaskRequestUtils } from "../../utils/task-request.utils";
import * as _ from "lodash"

/*
 key: unique identifier
 request: place holder for request
 dataResolver: DataResolverService instance for submitting request and resolving JSON response received from REST endpoint
 response: place holder for returning response back to the calling function
 allowMany: do you expect 1 or many records to get fetched? 
 NOTE:IF [allowMany==false, and taskNode.processMany == true]
      THEN processMany will override allowMany, so allowMany will be set to true;
*/
export class Task implements ITask{
  key: string;
  taskRequest: TaskRequest;
  dataResolver: any;
  taskResponse: TaskResponse;
  allowMany: boolean;

  /* MULTI-ROW Processing 
    --------------------------------
    Applies when the taskNode that this task belongs to has been configured with .processMany == true
    Used internally for storing multiple instances of the same request. 
    There's a 1:1 mapping between:
       # of parent-taskNode response rows being processed [to] # of request stored here. 
  */
  private processManyReqQ: TaskRequest[] = [];

  constructor(
    key: string,
    taskRequest: TaskRequest = new TaskRequest(),
    dataResolver: any,
    allowMany = true, // set to false if expecting a single unique record
  ) {
      this.key = key;
      this.taskRequest = taskRequest;
      this.dataResolver = dataResolver;
      this.taskResponse = new TaskResponse();
      this.allowMany = allowMany;

      this.processManyReqQ = new Array<TaskRequest>();
  }

  //Replace request object with corresponding values from parent-data
  async preProcess(parentResponseData?: any, parentRequestData?: any, processMany: boolean = false): Promise<any> {
    if(parentResponseData){
      if(processMany && Array.isArray(parentResponseData)){
        //console.log({'loc': 'preProcess-MULTI', 'request': this.taskRequest, 'processMany': processMany});

        parentResponseData.forEach((pDataRec) => {
          let reqQIdx = this.processManyReqQ.push(_.cloneDeep(this.taskRequest));

          let urlResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, pDataRec, false);
          //console.log({'loc': `preProcess-MULTI[${reqQIdx}]`, 'pData': pDataRec, 'replace': urlResponse, 'status': urlResponse.success});
          if(urlResponse.success){
            this.processManyReqQ[reqQIdx-1].url = urlResponse.data;
            //console.log({'loc': `preProcess-MULTI[${reqQIdx}]-PASS`, 'req-Q':  this.processManyReqQ[reqQIdx-1]});
            if(this.taskRequest.method === 'POST'){
              const bodyResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, pDataRec, true);
              if(bodyResponse.success){
                this.processManyReqQ[reqQIdx-1].body = JSON.parse(bodyResponse.data);
              } else {
                this.taskResponse.status = 200;
                this.taskResponse.errors.push(bodyResponse.error);
                return Promise.reject(this.taskResponse);
              }
            }
          } else {
            //console.log({'loc': `preProcess-MULTI[${reqQIdx}]-FAIL`, 'req-Q':  this.processManyReqQ[reqQIdx-1]});
            this.taskResponse.status = 200;
            this.taskResponse.errors.push(urlResponse.error);
            return Promise.reject(this.taskResponse);
          }
        })
      } else { //Single request processing
        //console.log({'loc': 'preProcess-SINGL', 'request': this.taskRequest, 'processMany': processMany});

        const urlResponse:ReplaceResponseType = TaskRequestUtils.replaceParams(this.taskRequest, parentResponseData, false);
        if(urlResponse.success){
          this.taskRequest.url = urlResponse.data;
          if(this.taskRequest.method === 'POST'){
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
        if(this.taskRequest.method === 'POST'){
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
        if(this.taskRequest.method === 'POST'){
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
      if(processMany && Array.isArray(this.processManyReqQ) && this.processManyReqQ.length > 0){
        /*
          MAP all request in queue, REDUCE all successful results.
        */
        //MAP
        const taskReqPromises: Promise<any>[] 
          = this.processManyReqQ
              .map((taskReq,idx) => {
                //console.log({'loc': `TASK[${this.key}]-process[b4]-Multi[${idx}]`, 'req': taskReq.url});
                return TaskRequestUtils.processTaskRequest(taskReq, this.dataResolver, this.allowMany);
              });
        
        //REDUCE
        let rspResults: any 
          = (await Promise.allSettled(taskReqPromises))
              .map((rsp, idx) => {
                    //console.log({'loc': `TASK[${this.key}]-process[after]-Multi[${idx}]`, 'rsp': rsp});
                    if (rsp.status === 'fulfilled') {
                      return rsp.value;
                    } else  {
                      return rsp.reason;
                    }
                  })
              .reduce( //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
                (accumulator, currentTaskRsp) => {
                  if(currentTaskRsp.hasData()){
                    return [ ...accumulator, ...currentTaskRsp.result];
                  }
                  return accumulator;
                }, []);
 
        //console.log({'loc': `TASK[${this.key}-process-Multi-FINAL`, 'response': rspResults});
        this.taskResponse.result = rspResults;

      } else {//Single request processing
        this.taskResponse = await TaskRequestUtils.processTaskRequest(this.taskRequest, this.dataResolver, this.allowMany);
        /*console.log({'loc': `TASK[${this.key}-process-Single`, 
                      'response': this.taskResponse, 
                      'hasData': this.taskResponse.hasData(),
                      'hasError': this.taskResponse.hasError()});*/

      }

      return Promise.resolve(this);
    } catch (error: any) {
      this.taskResponse.status = 500;
      this.taskResponse.errors.push((error.message ??= 'Unknown error message'));
      return Promise.reject(this);
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