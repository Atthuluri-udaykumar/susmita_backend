import { isArray } from "lodash";
import { TaskRequest } from "../models/task/task-request.model";
import { TaskResponse } from "../models/task/task-response.model";
import { TaskResponseUtils } from "./task-response.utils";

export interface ReplaceResponseType { 
  success: boolean,
  data: string,
  error: string  
}

export class TaskRequestUtils {
  /*  
    Replace each ${param} with its corresponding value pulled from passed Parent Response object. 
    parent-object[paramsMap.value] ------> will replace /abc/${paramsMap.key}/xyz. 
        
    Example:   
      For a taskList consisting of the following items:
      Parent  : task fetches Person object from remote by login-id or email-id or rre-id
              /persons?loginid=abc@def.com
      Children: task are dependent on the parent-response['personId'] item value which then is used by each of the task for 
              submitting their request to remote rendpoint(s). Each of these task might be say fetch questionaries, assoicated RREs, the AM or AR info by person-id
              Then for each of these children task, the url would look something like this:
              url: /persons/${param1}/qstns
                  /persons/${param1}/rres
              paramsMap: new Map([['${param1}', 'prsnId']]) 
              where, "prsnId" value is the name of the item-key found inside the parent's response object. This value 
                      would then replace the corresponding ${param1} in the url before being submitted to remote.
              The final url before submission for each one would then look something like these:
              /persons/1234/qstns
              /persons/1234/rres
  */
  static replaceParams( request: TaskRequest,
                        replacementDataObj: any, 
                        replaceBody:boolean = false, 
                        skipCheck: boolean = false): ReplaceResponseType {
    let response:ReplaceResponseType = 
                      {
                        success: true, 
                        data: replaceBody? JSON.stringify(request.body):request.url, 
                        error:''
                      };

    if (request.paramsMap && request.paramsMap.size > 0) {
      request.paramsMap.forEach((objKey, srchFor) => {
        if(skipCheck){
          response.data = response.data.replace(srchFor, objKey);
        } else {
          if(replacementDataObj && TaskRequestUtils.isKeyOfObject(objKey, replacementDataObj)){
            const keyVal = replacementDataObj[objKey];
            if( keyVal!= null){
              response.data = response.data.replace(srchFor, keyVal);
            } else {
              response.success = false;
              response.error= `${objKey} value is undefined`;  
              //console.log({'replaceParams-fail': response, 'srchfor': srchFor,'replaceWith': objKey, 'contextData': keyVal});
            }
          } else {
            response.success = false;
            response.error= `${objKey} not found`;
            //console.log({'replaceParams-key': response, 'contextData': replacementDataObj});
          }
          /*
          console.log({'replaceParams': this.key,
                      'srchfor': srchFor,
                      'replaceWith': objKey, 
                      'data': response.data, 
                      'contextData': replacementDataObj});*/
        }
      });
    }
    return response;
  }

  static isKeyOfObject<T extends object>(
    key: string | number | symbol,
    obj: T,
  ): key is keyof T {
    return key in obj;
  }

  /*
    Used for processing a single task-request
  */
  static async processTaskRequest(request: TaskRequest, dataResolver: any, allowMany: boolean): Promise<TaskResponse>{
    let taskResponse: TaskResponse = new TaskResponse();
    try {
      //console.log({'loc': 'processTaskRequest', 'request': request.url});
      if (request.isValid()) {
        let response: any = null;
        if (request.method === 'PUT') {
          response = await dataResolver.putData(request.url, request.body);
        } else if (request.method === 'POST') {
          response = await dataResolver.postData(request.url,request.body);
        } else if (request.method === 'DELETE') {
          response = await dataResolver.deleteData(request.url, request.body);
        } else { //fallback is GET
          response = await dataResolver.getDataArray(request.url);
        }

        if (request.method === 'GET') {
          if (response && Array.isArray(response)) {
            if (!allowMany && response.length > 1) {//multiple records fetched but expecting just one
              taskResponse = TaskResponseUtils.handleValidDataResponse(
                  null,
                  'Key Not Unique',
                );
            } else if (response.length === 0) {
              taskResponse = TaskResponseUtils.handleValidDataResponse(
                null,
                'Key not found',
              );
            } else {
              taskResponse = TaskResponseUtils.handleValidDataResponse(response);
            }

          } else {
            taskResponse = TaskResponseUtils.handleValidDataResponse(
              null,
              'Response not recognized',
            );
          }

        } else { //POST, PUT, DELETE
          if (!response || (response && response.rowsAffected < 1)) {
            taskResponse = TaskResponseUtils.handleValidDataResponse(
              null,
              'No rows affected',
            );
          } else {
            taskResponse = TaskResponseUtils.handleValidDataResponse(response);
          }
        }
      }

    } catch (error: any) {
      taskResponse = TaskResponseUtils.handleValidDataResponse(
        null,
        error.message ??= 'Unknown error message',
      );
    }
    
    return Promise.resolve(taskResponse);
  }

  
  /*
    Used for tracking and processing a single request from multi-request processing queue
  */
  static async processConditionalTaskRequest(trackingId: any, 
                                            request: TaskRequest, 
                                            dataResolver: any, 
                                            allowMany: boolean): Promise<TaskResponse>{
    let taskResponse: TaskResponse = new TaskResponse(trackingId);
    try {
      //console.log({'loc': 'processConditionalTaskRequest', 'request': request.url});
      if (request.isValid()) {
        let response: any = null;

        if (request.method === 'PUT') {
          response = await dataResolver.putData(request.url, request.body);
        } else if (request.method === 'POST') {
          response = await dataResolver.postData(request.url,request.body);
        } else if (request.method === 'DELETE') {
          response = await dataResolver.deleteData(request.url, request.body);
        } else { //fallback is GET
          response = await dataResolver.getDataArray(request.url);
        }

        if (request.method === 'GET') {
          if (response && Array.isArray(response)) {
            if (!allowMany && response.length > 1) {//multiple records fetched but expecting just one
              taskResponse = TaskResponseUtils.handleValidDataResponseV2(trackingId,
                  null,
                  'Key Not Unique',
                );
            } else if (response.length === 0) {
              taskResponse = TaskResponseUtils.handleValidDataResponseV2(trackingId,
                null,
                'Key not found',
              );
            } else {
              taskResponse = TaskResponseUtils.handleValidDataResponseV2(trackingId, response);
            }
          } else {
            taskResponse = TaskResponseUtils.handleValidDataResponseV2(trackingId,
              null,
              'Response not recognized',
            );
          }

        } else { //POST, PUT, DELETE
          if (!response || (response && response.rowsAffected < 1)) {
            taskResponse = TaskResponseUtils.handleValidDataResponseV2(trackingId,
              null,
              'No rows affected',
            );
          } else {
            taskResponse = TaskResponseUtils.handleValidDataResponseV2(trackingId, response);
          }
        }      
      
      }

    } catch (error: any) {
      taskResponse = TaskResponseUtils.handleValidDataResponseV2(trackingId,
        null,
        error.message ??= 'Unknown error message',
      );
    }
    
    return Promise.resolve(taskResponse);
  }
}
