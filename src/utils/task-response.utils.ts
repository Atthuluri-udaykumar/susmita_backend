import { TaskResponse } from "../models/task/task-response.model";

export class TaskResponseUtils {
  static parseSettledResponse(rsp: PromiseSettledResult<any>): TaskResponse {
    const taskResponse: TaskResponse = new TaskResponse();
    if (rsp.status === 'fulfilled') {
      taskResponse.result = rsp.value;
    } else {
      taskResponse.status = rsp.reason['status'];
      taskResponse.errors.push(rsp.reason['nessage']);
    }

    return taskResponse;
  }

  static handleValidDataResponse(
    response: any,
    message: string = '',
  ): TaskResponse {
    const taskResponse: TaskResponse = new TaskResponse();
    if (response) {
      taskResponse.result = response;
    } else {
      taskResponse.result = null;
      taskResponse.errors.push(message);
    }

    return taskResponse;
  }

  /*
    Merge 2 arrays of Objects of type V using the supplied merge-key.
    If a match is found in the 2nd array for the merge-key, and if they share any property then the property value 
    of the object from 2nd array will overwrite the existing value in the object from 1st array.
    Refer to Merge using spread operator
  */
  static merge2Responses<V extends Record<string, any>>(mergeKey: string, response1: V[], response2: V[]) : V[] {
    if( !response1 && !response2) {
      return [];
    } else if( response1 && !response2) {
      return response1 as V[];
    } else if( !response1 && response2) {
      return response2 as V[];
    } else {
      return (response1 as V[]).map((rsp1) => {
        const found = (response2 as V[]).find((rsp2) => rsp1[mergeKey] === rsp2[mergeKey]);
        return {...rsp1, ...found};
      });
    }
  }

  /*
    There has to be better way than using a for-loop! But, given the time crunch, this is what i got.
  */
  static mergeResponses<V extends Record<string, any>>(mergeKey: string, responses: V[][]) : V[] {
    if(responses && Array.isArray(responses) && responses.length >0){
      if(responses.length > 2){
        let merged: V[] = TaskResponseUtils.merge2Responses(mergeKey, responses.at(0) as V[], responses.at(1) as V[]);
        for(let idx=2; idx<responses.length; idx++){
          merged = TaskResponseUtils.merge2Responses(mergeKey, merged, responses.at(idx) as V[])
        }
        return merged;
      } else if(responses.length === 2){
        return TaskResponseUtils.merge2Responses(mergeKey, responses.at(0) as V[], responses.at(1) as V[]);
      } 
      return responses.at(0) as V[];
    }
    return [];
  }

  /*
   static async fetchTaskData(taskList: TaskList): Promise<TaskResponse> {
    let response = new TaskResponse();
    try {
      const rspData = await taskList.mainTask.srvc.getDataArray(
        taskList.mainTask.url,
      );

      //console.log(rspData);
      if (rspData) {
        if (rspData.length === 0) {
          //response.errors.push('Key not found');
          taskList.mainTask.response =
            TaskHandlerV0Service.handleValidDataResponse(null, 'Key not found');
        } else if (rspData.length > 1) {
          //response.errors.push('Key Not Unique');
          taskList.mainTask.response =
            TaskHandlerV0Service.handleValidDataResponse(null, 'Key Not Unique');
        } else {
          taskList.mainTask.response =
            TaskHandlerV0Service.handleValidDataResponse(rspData);
          const subTaskPromises: Promise<any>[] = [];
          TaskHandlerV0Service.replaceUrlParams(
            taskList.subTasks,
            rspData[0],
          ).forEach((url, idx) => {
            taskList.subTasks[idx].url = url;
            subTaskPromises.push(taskList.subTasks[idx].srvc.getDataArray(url));
          });

          if (subTaskPromises && subTaskPromises.length > 0) {
            const rspList = await Promise.allSettled(subTaskPromises);
            if (rspList) {
              rspList.forEach((rsp, idx) => {
                taskList.subTasks[idx].response =
                  TaskHandlerV0Service.handleSettledResponse(rsp);
              });
            }
          }

          //console.log(taskList);
        }
      } else {
        response.status = 500;
        response.errors = rspData.errors;
        return Promise.reject(response);
      }

      response = TaskHandlerV0Service.handleValidDataResponse(taskList);
      return Promise.resolve(response);
    } catch (error: any) {
      response.status = 500;
      response.errors.push((error.message ??= 'Unknown error message'));
      //error.message ??= 'Unknown error message';
      return Promise.reject(response);
    }
  }*/
}
