import { TaskResponse } from "../models/task/task-response.model";

export class TaskResponseUtils {
  static parseSettledResponse(rsp: PromiseSettledResult<any>): TaskResponse {
    const taskResponse: TaskResponse = new TaskResponse();
    if (rsp.status === 'fulfilled') {
      taskResponse.result = rsp.value;
    } else {
      taskResponse.status = rsp.reason['status'];
      taskResponse.errors.push(rsp.reason['message']);
    }

    return taskResponse;
  }

  static handleValidDataResponse(response: any, message: string = ''): TaskResponse {
    const taskResponse: TaskResponse = new TaskResponse();
    if (response) {
      taskResponse.result = response;
    } else {
      taskResponse.result = null;
      taskResponse.errors.push(message);
    }

    return taskResponse;
  }

  static handleValidDataResponseV2(trackingId: any, response: any, message: string = ''): TaskResponse {
    const taskResponse: TaskResponse = new TaskResponse(trackingId);
    if (response) {
      taskResponse.result = response;
    } else {
      taskResponse.result = null;
      taskResponse.errors.push(message);
    }

    return taskResponse;
  }

  /*
    Merge objects inside array of V[] using the merge-key provided
    Uses Array.reduce
  */
  static mergeResponses<V extends Record<string, any>>(mergeKey: string, responses: V[][]) : V[] {
      if(responses && Array.isArray(responses) && responses.length >0){
        if(responses.length > 1){
          //STEP-1: Reduce multiple arrays into a single array
          let allResponses = responses.reduce((rspArr1, rspArr2) => rspArr1.concat(rspArr2));

          //STEP-2: Reduce array by merging objects with the same merge-key value
          if(allResponses){
            const mergeKeyRspMap =   allResponses.reduce((accumulator, currResponse) => {
              if (accumulator[currResponse[mergeKey]]) {
                accumulator[currResponse[mergeKey]] = {...accumulator[currResponse[mergeKey]], ...currResponse};
              } else {
                accumulator[currResponse[mergeKey]] = currResponse;
              }
              return accumulator;
            }, {} as {[key: string]: V});

            //console.log({'Merge-Map=2': JSON.stringify(mergeKeyRspMap)});
            return Object.values(mergeKeyRspMap);  
          }
        } else if(responses.length === 1){
          const mergeKeyRspMap =   responses.at(0)?.reduce((accumulator, currResponse) => {
            if (accumulator[currResponse[mergeKey]]) {
              accumulator[currResponse[mergeKey]] = {...accumulator[currResponse[mergeKey]], ...currResponse};
            } else {
              accumulator[currResponse[mergeKey]] = currResponse;
            }
            return accumulator;
          }, {} as {[key: string]: V});

          //console.log({'Merge-Map=1': JSON.stringify(mergeKeyRspMap)});
          //return Object.values(mergeKeyRspMap); 
        }
        
        return responses.at(0) as V[];
      }
      return [];
    }


  /* ------------------- OLD Array of Array merge logic[start]---------------------
    Merge 2 arrays of Objects of type V using the supplied merge-key.
    If a match is found in the 2nd array for the merge-key, and if they share any property then the property value 
    of the object from 2nd array will overwrite the existing value in the object from 1st array.
    Refer to Merge using spread operator
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

  //There has to be better way than using a for-loop! But, given the time crunch, this is what i got.
  static mergeResponsesV0<V extends Record<string, any>>(mergeKey: string, responses: V[][]) : V[] {
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
   ------------------- OLD logic[end]--------------------- */
}
