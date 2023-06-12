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

/*interface PersonRolesInfo { 
  acctId: number;
  prsnId: number;
  deleteMrpRole?: boolean;
  deleteWcsRole?: boolean;
  deleteGhprpRole?: boolean;
  mrpAR?: boolean;
  ghprpAR?: boolean;
  wcsAR?: boolean;
  mraAR?: boolean;
  noPrsnAcctMra?: boolean;
  noPrsnAcctMrp?: boolean;
  noPrsnAcctWcs?: boolean;
  noPrsnAcctGhprp?: boolean;
}

interface PrsnAppCount { 
  prsnId: number;
  appList: {appName: string, count: string | number}[]; 
}*/
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
      //console.log({'place': 'inside gen-iter', 'key': nodeRsp.task.key, 'url': nodeRsp.task.request.url, 'response' : nodeRsp.task.response});
      result.set(nodeRsp.task.key, nodeRsp.task.response);
    }
    return this.formatRrePersonTaskResponse(result);
  }

  public async findARbyRptrId(rptrId: string): Promise<PersonInfo> {
    const taskTree: TaskTree<Task> = this.createPersonByRprtIdTaskTree();
    taskTree.rootNode.task.taskRequest.paramsMap.set('${param1}', rptrId);

    const result: Map<string, TaskResponse> = new Map<string, TaskResponse>();
    for await (const nodeRsp of taskTree.parse()) {
      //console.log({'place': 'inside gen-iter', 'key': nodeRsp.task.key, 'url': nodeRsp.task.request.url, 'response' : nodeRsp.task.response});
      result.set(nodeRsp.task.key, nodeRsp.task.response);
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
    rootNode.addChild(nodeRre);

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
    nodeFindARPrsn.addChild(nodeFindARPrsnRre);
    nodeFindAR.addChild(nodeFindARPrsn);
    rootNode.addChild(nodeFindAR);

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

  /*
  TASK_ACCTPRSN_ACCTID_KEY= 'AcctPersonByAcctIdTask';
  TASK_ACCTPRSN_PRSNID_KEY= 'AcctPersonByPrsnIdTask';
  TASK_FORKJOIN_RRE_PRSNACCT_KEY= 'ForkJoinRrePrsnAcctByPrsnIdTask';
  private createAcctPrsnRreTaskTree(appType: string): TaskTree<Task> {
    //fetch all personIDs associated to this appType+accountId
    const acctPrsnTask = new Task(
                          this.TASK_ACCTPRSN_ACCTID_KEY,
                          new TaskRequest('/accounts/${param1}/accountId/${param2}',new Map([['${param1}', ''], ['${param2}', '']])),
                          new MraDataResolverService<MirAcctPrsn>()
                        );
    acctPrsnTask.postProcess = (taskResponse: TaskResponse, parentData: any) => {
      if (taskResponse && taskResponse.hasData()) {
        if (Array.isArray(taskResponse.result)) {
          //re-map data fields
          taskResponse.result = 
          (taskResponse.result as MirAcctPrsn[])
            .map((acctPrsn) => (
              {
                acctId: acctPrsn.acctId,
                prsnId: acctPrsn.prsnId, 
                deleteMrpRole: (appType === 'mrp')? true: false,
                deleteWcsRole: (appType === 'wcs')? true: false,
                deleteGhprpRole: (appType === 'crcp')? true: false,
              }) 
            ) as PersonRolesInfo[];
        }
      }
      acctPrsnTask.taskResponse = taskResponse;
      return Promise.resolve(acctPrsnTask);
    };
    const rootNode: TaskNode<Task> = new TaskNode(acctPrsnTask);
    
    //fetch prsnInfo for each prsnId found in parent's response result-list
    const prsnTask =  new Task(
                            this.TASK_PRSN_KEY,
                            new TaskRequest('/persons/${param1}',new Map([['${param1}', 'prsnId']])),
                            new MraDataResolverService<MirPrsn>()
                          );
    prsnTask.postProcess = (taskResponse: TaskResponse, parentData: any) => {
      if (taskResponse && taskResponse.hasData() && Array.isArray(taskResponse.result)) {
        const acctPrsnList = (parentData && Array.isArray(parentData)) ? parentData: [];
        const personInfoList = taskResponse.result as MirPrsn[];

        acctPrsnList.forEach(acctPrsn => {
          const prsnInfo = personInfoList.find((prsn) => acctPrsn.prsnId === prsn.prsnId);
          if(prsnInfo) {
            acctPrsn.mrpAR= (prsnInfo.mrpRoleId && prsnInfo.mrpRoleId === this.ROLE_ID_AR)? true: false;
            acctPrsn.ghprpAR= (prsnInfo.ghpRoleId && prsnInfo.ghpRoleId === this.ROLE_ID_AR)? true: false;
            acctPrsn.wcsAR= (prsnInfo.wcsRoleId && prsnInfo.wcsRoleId === this.ROLE_ID_AR)? true: false;
          } else {
            acctPrsn.mrpAR= false;
            acctPrsn.ghprpAR= false;
            acctPrsn.wcsAR= false;
          }
        });

        taskResponse.result = acctPrsnList;
      } else {
        taskResponse.result = parentData;
      }
      prsnTask.taskResponse = taskResponse;
      return Promise.resolve(prsnTask);
    };

    //fetch all associated RREs for each prsnId found in parent's response result-list
    const rreTask = new Task(
      this.TASK_RRE_KEY,
      new TaskRequest('/persons/${param1}/rre',new Map([['${param1}', 'prsnId']])),
      new MraDataResolverService<MirRrePrsn>(),
    );
    rreTask.postProcess = (taskResponse: TaskResponse, parentData: any) => {
      //console.log({'loc': 'rreTask.postProcess','rsp': taskResponse, 'pData': parentData });

      if (taskResponse && taskResponse.hasData() && Array.isArray(taskResponse.result)) {
        const acctPrsnList = (parentData && Array.isArray(parentData)) ? parentData: [];
        const rreListByPrsn = taskResponse.result as MirRrePrsn[];

        acctPrsnList.forEach(acctPrsn => {
          acctPrsn.noPrsnAcctMra = true;
          acctPrsn.mraAR = false;

          const rreList = rreListByPrsn.filter((rrePrsn) => acctPrsn.prsnId === rrePrsn.prsnId);
          if(rreList && rreList.length > 0) {
            if(rreList.length === 1 && rreList.at(0)?.roleId === this.ROLE_ID_AR){
              acctPrsn.mraAR = true;
            }
            acctPrsn.noPrsnAcctMra = false;
          } 
        });

        taskResponse.result = acctPrsnList;
      } else {
        taskResponse.result = parentData;
      }

      rreTask.taskResponse = taskResponse;
      return Promise.resolve(rreTask);
    };
    
    //fetch all associated AccountIDs for each prsnId found in parent's response result-list
    const prsnAcctsTask = new Task(
                                this.TASK_ACCTPRSN_PRSNID_KEY,
                                new TaskRequest('/persons/${param1}/accounts',new Map([['${param1}', 'prsnId']])),
                                new MraDataResolverService<MirAcctPrsn>()
                              );
    prsnAcctsTask.postProcess = (taskResponse: TaskResponse, parentData: any) => {
      //console.log({'loc': 'prsnAcctsTask.postProcess','pData': parentData});
      if (taskResponse && taskResponse.hasData() && Array.isArray(taskResponse.result)) {
        //count of each distinct prsnId+aplctnName group
        const countByPrsnIdAppName = 
            (taskResponse.result as MirAcctPrsn[])
                .reduce((accumulator, {prsnId, aplctnName}) => {
                      if(!accumulator[prsnId]) accumulator[prsnId] = {};

                      const prsn = accumulator[prsnId];                                
                      if(!prsn[aplctnName]) prsn[aplctnName] = 0;
                      prsn[aplctnName]++;
                      return accumulator;
                    }, 
                    Object.create(null)
                  );
        
        //console.log({'loc': 'prsnAcctsTask.postProcess[countByPrsnIdAppName]','countGrpBy': countByPrsnIdAppName});
        //re-map/flatten multiple rows per person to single row
        let prsnAppList:PrsnAppCount[] = 
            Object.entries(countByPrsnIdAppName)
                  .map(([key, value]) => (
                        {
                          prsnId: Number(key), 
                          appList: Object.entries(value as {appName: string,count: number})
                                    .map(([key1, value1]) => (
                                          {appName: key1, count: value1}
                                        ))
                        }
                  ));

        //console.log({'loc': 'prsnAcctsTask.postProcess[prsnAppList]','prsnAppList': JSON.stringify(prsnAppList)});

        const acctPrsnList = (parentData && Array.isArray(parentData)) ? parentData: [];
        acctPrsnList.forEach(acctPrsn => {
          acctPrsn.noPrsnAcctMrp = true;
          acctPrsn.noPrsnAcctWcs = true;
          acctPrsn.noPrsnAcctGhprp = true;
          const prsnAppAccess = prsnAppList.find((prsnApp) => acctPrsn.prsnId === prsnApp.prsnId);
          if(prsnAppAccess && prsnAppAccess.appList.length > 0) {
            acctPrsn.noPrsnAcctMrp = (prsnAppAccess.appList.filter((appInfo) => appInfo.appName.toLowerCase() === 'mrp')?.length > 0)? false: true;
            acctPrsn.noPrsnAcctWcs = (prsnAppAccess.appList.filter((appInfo) => appInfo.appName.toLowerCase() === 'wcs')?.length > 0)? false: true;
            acctPrsn.noPrsnAcctGhprp = (prsnAppAccess.appList.filter((appInfo) => appInfo.appName.toLowerCase() === 'crcp')?.length > 0)? false: true;
          } 
          //console.log({'loc': `prsnAcctsTask.postProcess[prsnId=${prsn.prsnId}]`,'match': prsnAppAccess, 'prsnAppRec': prsn});
        });

        taskResponse.result = acctPrsnList;
      } else {
        taskResponse.result = parentData;
      }

      prsnAcctsTask.taskResponse = taskResponse;
      return Promise.resolve(prsnAcctsTask);
    };

    const forkJoinNode: ForkJoinNode<Task, PersonRolesInfo> = 
                            new ForkJoinNode(this.TASK_FORKJOIN_RRE_PRSNACCT_KEY,
                                              true,
                                              prsnTask,
                                              rreTask,
                                              prsnAcctsTask);
                                                
    // create relationship: [AcctPrsnTask] -> forkJoinNode[PersonTask, RreTask, PrsnAcctTask]
    rootNode.addChild(forkJoinNode);

    return new TaskTree(rootNode);
  }
  async findARbyAcctId(appType: string, accountId: string): Promise<PersonInfo> {
    const appName = appType==='ghprp'? 'crcp': appType;
    const taskTree: TaskTree<Task> = this.createAcctPrsnRreTaskTree(appName);
    taskTree.rootNode.task.taskRequest.paramsMap.set('${param1}', appName.toUpperCase());
    taskTree.rootNode.task.taskRequest.paramsMap.set('${param2}', accountId);

    for await (const nodeRsp of taskTree.parse()) {
      console.log({'place': 'inside nRow gen-iter', 
                    'key': nodeRsp.task.key, 'url': nodeRsp.task.taskRequest.url, 
                    'response' : JSON.stringify(nodeRsp.task.taskResponse)});
    }
    return new PersonInfo();
  }*/
}


