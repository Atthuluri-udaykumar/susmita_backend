import { injectable } from 'inversify';
import * as _ from "lodash"
import { MirPrsn } from '../models/mir-prsn.model';
import { MirRrePrsn } from '../models/mir-rre-prsn.model';
import { MraDataResolverService } from './mra-data-resolver-service';
import { PersonInfo } from '../models/person-info.model';
import { Task } from '../models/task/task.model';
import { TaskTree } from '../models/task/task-tree.model';
import { TaskResponse } from '../models/task/task-response.model';
import { IAuthorisedRepService } from './interfaces/authorised-rep-service.interface';
import { TaskNode } from '../models/task/task-node.model';
import { TaskRequest } from '../models/task/task-request.model';
import { Mirt01Reporter } from '../models/mirt01reporter.model';

@injectable()
export class AuthorisedRepService implements IAuthorisedRepService {
  TASK_PRSN_KEY = 'PersonTask';
  TASK_RRE_KEY = 'RreTask';
  TASK_RPRTR_KEY = 'ReporterTask';
  TASK_FIND_AR_KEY = 'FindARTask';

  //Refer to /app/section111/blob/master/mra-common/src/main/java/gov/hhs/cms/cob/mir/common/enums/MIRRoleType.java
  ROLE_ID_AR = 1;
  
  public async findARbyEmail(email: string): Promise<PersonInfo> {
    const taskTree: TaskTree<Task> = this.createPersonByEmailTaskTree();
    taskTree.rootNode.task.taskRequest.paramsMap.set('${param1}', email);

    const result: Map<string, TaskResponse> = new Map<string, TaskResponse>();
    for await (const nodeRsp of taskTree.parse()) {
      //console.log({'place': 'inside gen-iter', 'key': nodeRsp.task.key, 'url': nodeRsp.task.taskRequest.url, 'response' : nodeRsp.task.taskResponse});
      result.set(nodeRsp.task.key, nodeRsp.task.taskResponse);
    }
    return this.formatRrePersonTaskResponse(result);
  }

  public async findARbyRptrId(rptrId: string): Promise<PersonInfo> {
    const taskTree: TaskTree<Task> = this.createPersonByRprtIdTaskTree();
    taskTree.rootNode.task.taskRequest.paramsMap.set('${param1}', rptrId);

    const result: Map<string, TaskResponse> = new Map<string, TaskResponse>();
    for await (const nodeRsp of taskTree.parse()) {
      //console.log({'place': 'inside gen-iter', 'key': nodeRsp.task.key, 'url': nodeRsp.task.taskRequest.url, 'response' : nodeRsp.task.taskResponse});
      result.set(nodeRsp.task.key, nodeRsp.task.taskResponse);
    }
    return this.formatRrePersonTaskResponse(result, true);
  }

  private createPersonByEmailTaskTree(): TaskTree<Task> {
    //create all tree nodes
    const prsnTask =  new Task(
                              this.TASK_PRSN_KEY,
                              new TaskRequest('/persons?email=${param1}',new Map([['${param1}', '']])),
                              new MraDataResolverService<MirPrsn>(),
                              false, //UNIQUE
                            );
    //override default postProcessing method on this task
    prsnTask.postProcess = (taskResponse: TaskResponse) => {
                              if (taskResponse && taskResponse.hasData()) {
                                if (Array.isArray(taskResponse.result)) {
                                  for(let prsn of taskResponse.result) {
                                    if(prsn){
                                      prsn.vldtnStusDesc = MirPrsn.getVldtnStusDesc(prsn.vldtnStusId);

                                      if(!prsnTask.allowMany) {//access the first element
                                        taskResponse.result = prsn;
                                        break;
                                      }
                                    }
                                  };
                                }
                              }
                              prsnTask.taskResponse = taskResponse;
                              return Promise.resolve(prsnTask);
                            };
    const rootNode: TaskNode<Task> = new TaskNode(prsnTask);
    
    const rreTask = new Task(
                          this.TASK_RRE_KEY,
                          new TaskRequest('/persons/${param1}/rre',new Map([['${param1}', 'prsnId']])),
                          new MraDataResolverService<MirRrePrsn>(),
                        );
    rreTask.postProcess = (taskResponse: TaskResponse, parentData: any) => {
                            if (taskResponse && taskResponse.hasData()) {
                              if (Array.isArray(taskResponse.result)) {
                                //sort by rptrId ascending
                                const sortedRreList = (taskResponse.result as MirRrePrsn[])
                                                        .sort((rreA, rreB) => 
                                                          (rreA.rptrId! > rreB.rptrId!) ? 1: 
                                                            (
                                                              (rreB.rptrId! > rreA.rptrId!)? -1:0
                                                            )
                                                        );
                                taskResponse.result = sortedRreList;
                              }
                            }
                            rreTask.taskResponse = taskResponse;
                            return Promise.resolve(rreTask);
                          };
    const nodeRre: TaskNode<Task> = new TaskNode(rreTask);


    /* create relationship: [PersonTask] -> [RreTask] */
    rootNode.addChildNode(nodeRre);

    return new TaskTree(rootNode);
  }

  private createPersonByRprtIdTaskTree(): TaskTree<Task> {
    //create all tree nodes
    const verifyRptrTask =  new Task(
                              this.TASK_RPRTR_KEY,
                              new TaskRequest('/reporters/${param1}',new Map([['${param1}', '']])),
                              new MraDataResolverService<Mirt01Reporter>(),
                              false, //UNIQUE
                            );
    //override default postProcessing method on this task
    verifyRptrTask.postProcess = (taskResponse: TaskResponse) => {
                                    if (taskResponse && taskResponse.hasData()) {
                                      if (Array.isArray(taskResponse.result)) {
                                        for(let rprtr of taskResponse.result) {
                                          if(rprtr){
                                            if(!verifyRptrTask.allowMany) {//access the first element
                                              taskResponse.result = rprtr;
                                              break;
                                            }
                                          }
                                        };
                                      }
                                    }
                                    verifyRptrTask.taskResponse = taskResponse;
                                    return Promise.resolve(verifyRptrTask);
                                  };
    const rootNode: TaskNode<Task> = new TaskNode(verifyRptrTask);

    const findARTask = new Task(
                              this.TASK_FIND_AR_KEY,
                              new TaskRequest('/accounts/mra?rptrId=${param1}',new Map([['${param1}', 'rptrId']])),
                              new MraDataResolverService<MirRrePrsn>(),
                            );
    //override default postProcessing method on this task
    findARTask.postProcess = (taskResponse: TaskResponse) => {
                                if (taskResponse && taskResponse.hasData()) {
                                  let arFound:boolean = false;
                                  if (Array.isArray(taskResponse.result)) {
                                    for(let rec of taskResponse.result) {
                                      if(rec){
                                        //We are assuming that the results are arranged in ascending order, pick the last one in case multiple records are found
                                        if(rec.prsnId && !rec.rreStusId && (rec.roleId === this.ROLE_ID_AR)){
                                          taskResponse.result = rec;
                                          arFound = true;
                                          //break;
                                        }
                                      }
                                    };

                                    if(!arFound){
                                      taskResponse.result = null;
                                      taskResponse.errors.push('AR not found');
                                    }
                                  }
                                }
                                findARTask.taskResponse = taskResponse;
                                return Promise.resolve(findARTask);
                              };
    const nodeFindAR: TaskNode<Task> = new TaskNode(findARTask);

    const arPrsnTask =  new Task(
                              this.TASK_PRSN_KEY,
                              new TaskRequest('/persons/${param1}',new Map([['${param1}', 'prsnId']])),
                              new MraDataResolverService<MirPrsn>(),
                              false, //UNIQUE
                            );
    //override default postProcessing method on this task
    arPrsnTask.postProcess = (taskResponse: TaskResponse) => {
                                if (taskResponse && taskResponse.hasData()) {
                                  if (Array.isArray(taskResponse.result)) {
                                    for(let prsn of taskResponse.result) {
                                      if(prsn){
                                        //prsn.vldtnStusDesc = MirPrsn.getVldtnStusDesc(prsn.vldtnStusId);

                                        if(!arPrsnTask.allowMany) {//access the first element
                                          taskResponse.result = prsn;
                                          break;
                                        }
                                      }
                                    };
                                  }
                                }
                                arPrsnTask.taskResponse = taskResponse;
                                return Promise.resolve(arPrsnTask);
                              };
    const nodeFindARPrsn: TaskNode<Task> = new TaskNode(arPrsnTask);

    const arPrsnRreTask = new Task(
                                this.TASK_RRE_KEY,
                                new TaskRequest('/persons/${param1}/rre',new Map([['${param1}', 'prsnId']])),
                                new MraDataResolverService<MirRrePrsn>(),
                              );
    //override default postProcessing method on this task
    arPrsnRreTask.postProcess = (taskResponse: TaskResponse, parentData: any) => {
                                  if (taskResponse && taskResponse.hasData()) {
                                    if (Array.isArray(taskResponse.result)) {
                                      //sort by rptrId ascending
                                      const sortedRreList = (taskResponse.result as MirRrePrsn[])
                                                              .sort((rreA, rreB) => 
                                                                (rreA.rptrId! > rreB.rptrId!) ? 1: 
                                                                  (
                                                                    (rreB.rptrId! > rreA.rptrId!)? -1:0
                                                                  )
                                                              );
                                      taskResponse.result = sortedRreList;
                                    }
                                  }
                                  arPrsnRreTask.taskResponse = taskResponse;
                                  return Promise.resolve(arPrsnRreTask);
                                };
    const nodeFindARPrsnRre: TaskNode<Task> = new TaskNode(arPrsnRreTask);

    /* create relationship: [ReporterTask] -> [findARTask] -> [findARPrsnTask] -> [findARPrsnRreTask] */
    nodeFindARPrsn.addChildNode(nodeFindARPrsnRre);
    nodeFindAR.addChildNode(nodeFindARPrsn);
    rootNode.addChildNode(nodeFindAR);

    return new TaskTree(rootNode);
  }

  private formatRrePersonTaskResponse(responseMap: Map<string, TaskResponse>, rreIdSrchType: boolean = false): Promise<PersonInfo> {
    const personInfo: PersonInfo = new PersonInfo();

    if (responseMap && responseMap.size > 0) {
      if(rreIdSrchType) {
        const reporterData = responseMap.get(this.TASK_RPRTR_KEY);
        if (!reporterData || !reporterData.processingSuccess() || reporterData.hasError()) {
          personInfo.person = responseMap.get(this.TASK_RPRTR_KEY)?.errors[0];
          return Promise.resolve(personInfo);
        }
      }

      const prsnData = responseMap.get(this.TASK_PRSN_KEY);
      if (prsnData && prsnData.processingSuccess() && prsnData.hasData()) {
        personInfo.person = prsnData.result;
        personInfo.rreList = responseMap.get(this.TASK_RRE_KEY)?.processingSuccess() && responseMap.get(this.TASK_RRE_KEY)?.hasData()
          ? responseMap.get(this.TASK_RRE_KEY)?.result
          : []; //responseMap.get(this.TASK_RRE_KEY)?.errors;

        return Promise.resolve(personInfo);
      } else {
        personInfo.person = responseMap.get(this.TASK_PRSN_KEY)?.errors[0];
        return Promise.resolve(personInfo);
      }
    } else {
      return Promise.reject('Person not found');
    }
  }

}


