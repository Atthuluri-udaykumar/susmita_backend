import { injectable } from 'inversify';
import { MirPrsn } from '../models/mir-prsn.model';
import { MirRrePrsn } from '../models/mir-rre-prsn.model';
import { MraDataResolverService } from './mra-data-resolver-service';
import { Task } from '../models/task/task.model';
import { TaskTree } from '../models/task/task-tree.model';
import { TaskResponse } from '../models/task/task-response.model';
import { TaskNode } from '../models/task/task-node.model';
import { TaskRequest } from '../models/task/task-request.model';
import { IRemoveAccountService } from './interfaces/remove-account-service.interface';
import { AccountPersonRolesInfo, PersonRolesActionStatusDetails, PersonRolesInfo } from '../models/account-info.model';
import { AppType } from '../models/apptypes.model';
import { User } from '../types/custom';
import { MirAcctPrsn } from '../models/mir-acct-prsn.model';
import { CollectionNode } from '../models/task/collection-node.model';
import { DecisionNode } from '../models/task/decision-node.model';
import { ConditionalTask } from '../models/task/conditional-task.model';
import { cloneDeep } from 'lodash';

interface PrsnAppCount { 
  prsnId: number;
  appList: {appName: string, count: string | number}[]; 
}

@injectable()
export class RemoveAccountService implements IRemoveAccountService {
  PROCESSING_STATUS_PASS = 'PASS';

  //RootNode
  TASK_ACCTPRSN_ACCTID_KEY= 'AcctPersonByAcctIdTask';
  
  //Layer-1: Collection 
  NODE_COLLECT_PRSNACCTRRE_INFO_KEY= 'CollectPrsnAcctRreByPrsnIdInfoNode';
  TASK_PRSN_KEY = 'PersonTask';
  TASK_RRE_KEY = 'RreTask';
  TASK_ACCTPRSN_PRSNID_KEY= 'AcctPersonByPrsnIdTask';

  //Layer-2: Decision 
  NODE_DECISION_ACCTPRSN_ACTION_KEY= 'AcctPrsnDecisionActionNode';
  TASK_UPDGHPPRSN_KEY = 'UpdateGhpPrsnTask';
  TASK_UPDMRPPRSN_KEY = 'UpdateMrpPrsnTask';
  TASK_UPDWCSPRSN_KEY = 'UpdateWcsPrsnTask';
  TASK_DELPRSN_KEY = 'DeletePrsnTask';
  TASK_DELACCOUNT_KEY = 'DeleteAccountByAppTypeTask';
  
  //Refer to /app/section111/blob/master/mra-common/src/main/java/gov/hhs/cms/cob/mir/common/enums/MIRRoleType.java
  ROLE_ID_AR = 1;
  
  WCS_NULL_USER = 5;
  MRP_NULL_USER = 6;
  GHPRP_NULL_USER = 8;
  
  /*
    Original Processing logic: MRAEDIAccessServiceBean.removePersonAccountAndPerson()
  */
  public async removePersonAccountAndPerson(user: User, appType: AppType, accountId: number): Promise<any> {
    let processingStatus = this.PROCESSING_STATUS_PASS;
    let acctPrsnInfoList: PersonRolesInfo[] = [];
    let acctPrsnActionStatuses: PersonRolesActionStatusDetails[] = [];
    let txnLogs: any[] = new Array<any>();

    //Setup Task Tree
    const taskTree: TaskTree<Task> = this.createAcctPrsnRreTaskTree(user, appType, accountId);
    taskTree.rootNode.task.taskRequest.paramsMap.set('${param1}', ((appType === AppType.GHPRP)? 'crcp': appType.value()).toUpperCase());
    taskTree.rootNode.task.taskRequest.paramsMap.set('${param2}', String(accountId));

    try {
      //Process Task Tree
      let acctPrsnAssocFound = false;
      for await (const nodeRsp of taskTree.parse()) {
        //console.log({'key': `${nodeRsp.task.key}-${appType.value()}-${accountId}`, 'response' : JSON.stringify(nodeRsp.task.taskResponse)});
        if(nodeRsp.task.key === this.TASK_ACCTPRSN_ACCTID_KEY){
          if(nodeRsp.task.taskResponse.hasData()){
            acctPrsnAssocFound = true;
            txnLogs.push({key: this.TASK_ACCTPRSN_ACCTID_KEY, status: 'Person Association(s) found'});
          } else {
            txnLogs.push({key: this.TASK_ACCTPRSN_ACCTID_KEY, status: nodeRsp.task.taskResponse.errors});
          }
        } else if(nodeRsp.task.key === this.TASK_DELACCOUNT_KEY){
          txnLogs.push({key: this.TASK_DELACCOUNT_KEY, 
                        status: nodeRsp.task.taskResponse.hasData()? 
                                nodeRsp.task.taskResponse.result: nodeRsp.task.taskResponse.errors});
        } else if(nodeRsp.task.key === this.NODE_COLLECT_PRSNACCTRRE_INFO_KEY && nodeRsp.task.taskResponse.hasData()){
          if(nodeRsp.task.taskResponse.hasData()){
            acctPrsnInfoList = nodeRsp.task.taskResponse.result as PersonRolesInfo[]; 
          } else {
            txnLogs.push({key: this.NODE_COLLECT_PRSNACCTRRE_INFO_KEY, status: nodeRsp.task.taskResponse.errors});
          }
        } else  if(nodeRsp.task.key === this.NODE_DECISION_ACCTPRSN_ACTION_KEY && nodeRsp.task.taskResponse.hasData()){
          if(nodeRsp.task.taskResponse.hasData()){
            acctPrsnActionStatuses = nodeRsp.task.taskResponse.result as PersonRolesActionStatusDetails[]; 
          } else {
            txnLogs.push({key: this.NODE_DECISION_ACCTPRSN_ACTION_KEY, status: nodeRsp.task.taskResponse.errors});
          }
        }
      }

      //Take further action based on Task Tree responses 
      if(acctPrsnAssocFound){
        if(Array.isArray(acctPrsnActionStatuses) && acctPrsnActionStatuses.length>0){
          //for each associated person-ID  
          acctPrsnActionStatuses.forEach(async (currPrsnTaskActionStatus) => {
            if( Array.isArray(currPrsnTaskActionStatus.taskActionStatuses) 
                && currPrsnTaskActionStatus.taskActionStatuses.length>0){
                const processedTaskStatuses = currPrsnTaskActionStatus.taskActionStatuses.filter(taskStatus => taskStatus.processed);
                processedTaskStatuses.forEach(
                  taskStatus => {
                    txnLogs.push({key: taskStatus.taskId, status: taskStatus});
                    if( taskStatus.taskId ==='DeletePrsnTask'
                        && (Array.isArray(taskStatus.results) && taskStatus.results?.length>0)
                        && (Array.isArray(taskStatus.errors) && taskStatus.errors?.length<1)){
                      // if person-id was deleted from database, delete it from LDAP
                      const acctPrsn =  acctPrsnInfoList.find(prsn => prsn.prsnId === Number(currPrsnTaskActionStatus.prsnId));
                      if(acctPrsn){
                        /*
                        const delPrsnLdapStatus = await this.removeUserFromLDAP(acctPrsn.prsnInfo.loginId);
                        txnLogs.push({key: `DeleteFromLDAP[${acctPrsn.prsnId}:${acctPrsn.prsnInfo.loginId}]`, status: delPrsnLdapStatus});
                        */
                        console.log(`DELETE from LDAP: Person-ID[${acctPrsn.prsnId}] LOGIN-ID[${acctPrsn.prsnInfo.loginId}]`);
                      }
                    }

                  });
            }
          });

          /*
          acctPrsnActionStatuses.forEach(async (currPrsnTaskActionStatus) => {
            if(Array.isArray(currPrsnTaskActionStatus.taskActionStatuses) 
              && currPrsnTaskActionStatus.taskActionStatuses.length>0
              && (currPrsnTaskActionStatus.taskActionStatuses
                  .filter(taskStatus => 
                          taskStatus.taskId ==='DeletePrsnTask'
                          && taskStatus.processed 
                          && (Array.isArray(taskStatus.results) && taskStatus.results?.length>0)
                          && (Array.isArray(taskStatus.errors) && taskStatus.errors?.length<1)
                  ).length>0)
            ){
              // if person-id was deleted from database, delete it from LDAP
              const acctPrsn =  acctPrsnInfoList.find(prsn => prsn.prsnId === Number(currPrsnTaskActionStatus.prsnId));
              if(acctPrsn){
                //const delPrsnLdapStatus = await this.removeUserFromLDAP(acctPrsn.prsnInfo.loginId);
                //if(delPrsnLdapStatus && delPrsnLdapStatus.error){
                //  currPrsnTaskActionStatus.deleteFromLDAPStatus = false;
                //}
                console.log(`DELETE from LDAP: Person-ID[${acctPrsn.prsnId}] LOGIN-ID[${acctPrsn.prsnInfo.loginId}]`);
              }
            }
          });*/
        }
      }

      //console.log({'RemoveAcctPrsnAcctStatus': JSON.stringify(txnLogs)});

      return Promise.resolve(txnLogs);        
    } catch (error) {
      return Promise.reject({ status: 500, error: error });
    }
  }
  
  /* ===============================================================================================
    Private helper methods
  */
  private async removeUserFromLDAP(personLoginId: string): Promise<any> {
   const mraDataResolver = new MraDataResolverService<MirPrsn>();  

   try {
     const deleteResponse: any = await mraDataResolver.deleteData(`/cob-auth/login?username=${personLoginId}`);
   
     //handle response
     if (!deleteResponse || (deleteResponse && deleteResponse.rowsAffected < 1)) {
       return Promise.resolve({ status: 500, error: 'Error deleting Person from LDAP'});
     }

     return Promise.resolve(this.PROCESSING_STATUS_PASS);
   } catch (error) {
     return Promise.resolve({ status: 500, error: error});
   }
  }

  private createAcctPrsnRreTaskTree(user: User, appType: AppType, accountId: number): TaskTree<Task> {
    //fetch all personIDs associated to this appType+accountId
    const appName = ((appType === AppType.GHPRP)? 'crcp': appType.value()).toUpperCase();
    const acctPrsnTask = new Task(
                          this.TASK_ACCTPRSN_ACCTID_KEY,
                          new TaskRequest(`/accounts/${appName}/accountId/${accountId}`,new Map([])),
                          new MraDataResolverService<MirAcctPrsn>()
                        );
    acctPrsnTask.postProcess = (taskResponse: TaskResponse, parentData: any) => {
      if (taskResponse && taskResponse.hasData()) {
        if (Array.isArray(taskResponse.result)) {
          const acctPersons= {
            acctId: accountId,
            aplctnName: appName,
            associatedPersons: (taskResponse.result as MirAcctPrsn[])
            .map((acctPrsn) => (
              {
                prsnId: acctPrsn.prsnId, 
                deleteMrpRole: (appType === AppType.MRP)? true: false,
                deleteWcsRole: (appType === AppType.WCS)? true: false,
                deleteGhprpRole: (appType === AppType.GHPRP)? true: false,
              }) 
            ) as PersonRolesInfo[]
            
          } as AccountPersonRolesInfo;

          //re-map data fields
          taskResponse.result = acctPersons;
        }
      }

      acctPrsnTask.taskResponse = taskResponse;
      return Promise.resolve(acctPrsnTask);
    };
    const rootNode: TaskNode<Task> = new TaskNode(acctPrsnTask);

    //Delete account from mir_acct_prsn table
    const deleteAcctPrsnTask = 
            new Task(this.TASK_DELACCOUNT_KEY,
                    new TaskRequest(`/accounts/${appName}/accountId/${accountId}`,
                            new Map([]),
                            'REST',
                            'DELETE'),
                    new MraDataResolverService<MirRrePrsn>());
    deleteAcctPrsnTask.postProcess = (taskResponse: TaskResponse, parentData: any) => {
      if (taskResponse && taskResponse.hasData()) {//delete succeeded
        const acctPrsnList = parentData ? parentData as AccountPersonRolesInfo: {};

        //re-map data fields
        taskResponse.result = (acctPrsnList as AccountPersonRolesInfo).associatedPersons;
      } 

      deleteAcctPrsnTask.taskResponse = taskResponse;

      return Promise.resolve(deleteAcctPrsnTask);
    };
    const deleteAcctPrsnNode: TaskNode<Task> = new TaskNode(deleteAcctPrsnTask);

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
            acctPrsn.prsnInfo = prsnInfo;
          } else {
            acctPrsn.mrpAR= false;
            acctPrsn.ghprpAR= false;
            acctPrsn.wcsAR= false;
            acctPrsn.prsnInfo = {};
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
            acctPrsn.noPrsnAcctMrp = (prsnAppAccess.appList.filter((appInfo) => appInfo.appName.toLowerCase() === AppType.MRP.value())?.length > 0)? false: true;
            acctPrsn.noPrsnAcctWcs = (prsnAppAccess.appList.filter((appInfo) => appInfo.appName.toLowerCase() === AppType.WCS.value())?.length > 0)? false: true;
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

    const acctPersonInfoNode: CollectionNode<Task, PersonRolesInfo> = 
                            new CollectionNode(this.NODE_COLLECT_PRSNACCTRRE_INFO_KEY,
                                              'prsnId',//Merge Key
                                              prsnTask,
                                              rreTask,
                                              prsnAcctsTask);
    
    //--------------Action Processing Logic-----------------------------------------------
    //fetch all associated RREs for each prsnId found in parent's response result-list
    const deletePrsnTask = 
            new ConditionalTask(
                    this.TASK_DELPRSN_KEY,
                    new TaskRequest('/persons/${param1}',
                            new Map([['${param1}', 'prsnId']]),
                            'REST',
                            'DELETE',
                            {requestedBy: user.userName}),
                    new MraDataResolverService<MirRrePrsn>(),
                    true,
                    'prsnId'
                  );
    deletePrsnTask.allowProcessingCriteria = (parentDataRecord: any): boolean => {
      let pDataRec = parentDataRecord as PersonRolesInfo;
      if( (!pDataRec.wcsAR && !pDataRec.mrpAR) ||
          (pDataRec.wcsAR && pDataRec.deleteWcsRole) ||
          (pDataRec.mrpAR && pDataRec.deleteMrpRole)
      ){
          return true;
      } 

      return false;
    };

    const updateGhprpPrsnRoleIdTask = 
              new ConditionalTask(
                      this.TASK_UPDGHPPRSN_KEY,
                      new TaskRequest('/persons',
                            new Map(),
                            'REST',
                            'PUT'
                      ),
                      new MraDataResolverService<MirPrsn>(),
                      true,
                      'prsnId'
                    );
    
    updateGhprpPrsnRoleIdTask.allowProcessingCriteria = (parentDataRecord: any): boolean => {
      //return true;
      let pData = parentDataRecord as PersonRolesInfo;
      if( pData.deleteGhprpRole && pData.noPrsnAcctGhprp){
        return true;
      } 

      return false;
    };
    updateGhprpPrsnRoleIdTask.updateRequestBody = (parentDataRecord: any, requestBodyPayload: any): any => {
      if (parentDataRecord) {
        const changedPayload = cloneDeep(parentDataRecord.prsnInfo) as MirPrsn;
        if(parentDataRecord.mraAR && parentDataRecord.mrpAR && parentDataRecord.wcsAR) {
          changedPayload.loginId = '';
        }
        changedPayload.ghpRoleId = this.GHPRP_NULL_USER;

        /*console.log({'loc':'updateGhprpPrsnRoleIdTask.updateRequestBody',
                'before': JSON.stringify(requestBodyPayload), 
                'after':JSON.stringify(changedPayload)});*/
        return changedPayload;
      }

      //console.log({'loc':'updateGhprpPrsnRoleIdTask.updateRequestBody','after': 'NO_CHANGE'});
      return requestBodyPayload;
    };

    const updateMrpPrsnRoleIdTask = 
              new ConditionalTask(
                      this.TASK_UPDMRPPRSN_KEY,
                      new TaskRequest('/persons',
                            new Map(),
                            'REST',
                            'PUT'
                      ),
                      new MraDataResolverService<MirPrsn>(),
                      true,
                      'prsnId'
                    );
    updateMrpPrsnRoleIdTask.allowProcessingCriteria = (parentDataRecord: any): boolean => {
      let pData = parentDataRecord as PersonRolesInfo;
      if( pData.deleteMrpRole && pData.noPrsnAcctMrp){
        return true;
      } 

      return false;
    };
    updateMrpPrsnRoleIdTask.updateRequestBody = (parentDataRecord: any, requestBodyPayload: any): any => {
      if (parentDataRecord) {
        const changedPayload = cloneDeep(parentDataRecord.prsnInfo) as MirPrsn;
        if(parentDataRecord.mraAR && parentDataRecord.ghprpAR && parentDataRecord.wcsAR) {
          changedPayload.loginId = '';
        }
        changedPayload.mrpRoleId = this.MRP_NULL_USER;

        /*console.log({'loc':'updateGhprpPrsnRoleIdTask.updateRequestBody',
                'before': JSON.stringify(requestBodyPayload), 
                'after':JSON.stringify(changedPayload)});*/
        return changedPayload;
      }

      //console.log({'loc':'updateMrpPrsnRoleIdTask.updateRequestBody','after': 'NO_CHANGE'});
      return requestBodyPayload;
    };

    const updateWcsPrsnRoleIdTask = 
              new ConditionalTask(
                      this.TASK_UPDWCSPRSN_KEY,
                      new TaskRequest('/persons',
                            new Map(),
                            'REST',
                            'PUT'
                      ),
                      new MraDataResolverService<MirPrsn>(),
                      true,
                      'prsnId'
                    );
    updateWcsPrsnRoleIdTask.allowProcessingCriteria = (parentDataRecord: any): boolean => {
      let pData = parentDataRecord as PersonRolesInfo;
      if( pData.deleteWcsRole && pData.noPrsnAcctWcs){
        return true;
      } 

      return false;
    };
    updateWcsPrsnRoleIdTask.updateRequestBody = (parentDataRecord: any, requestBodyPayload: any): any => {
      if (parentDataRecord) {
        const changedPayload = cloneDeep(parentDataRecord.prsnInfo) as MirPrsn;
        if(parentDataRecord.mraAR && parentDataRecord.mrpAR && parentDataRecord.ghprpAR) {
          changedPayload.loginId = '';
        }
        changedPayload.wcsRoleId = this.WCS_NULL_USER;

        /*console.log({'loc':'updateGhprpPrsnRoleIdTask.updateRequestBody',
                'before': JSON.stringify(requestBodyPayload), 
                'after':JSON.stringify(changedPayload)});*/
        return changedPayload;
      }

      //console.log({'loc':'updateWcsPrsnRoleIdTask.updateRequestBody','after': 'NO_CHANGE'});
      return requestBodyPayload;
    };

    /*
      Records that pass the decision-criteria provided will be processed by onPassCriteria==true conditional-task(s), concurrently
      Records that fail the decision-criteria provided will be processed by onPassCriteria==false conditional-task(s), concurrently

      Each conditional task has its own criteria to filter which records get processed, and which to skip.
    */
    const acctPersonActionDecisionNode: DecisionNode<ConditionalTask, PersonRolesInfo> = 
                            new DecisionNode(this.NODE_DECISION_ACCTPRSN_ACTION_KEY,
                                              'prsnId', //Merge-Key
                                              {onPassCriteria: true,  task: deletePrsnTask},
                                              {onPassCriteria: false, task: updateGhprpPrsnRoleIdTask},
                                              {onPassCriteria: false, task: updateMrpPrsnRoleIdTask},
                                              {onPassCriteria: false, task: updateWcsPrsnRoleIdTask});

    acctPersonActionDecisionNode.decisionCriteria = (parentDataRecord: any): boolean => {
      let pDataRec = parentDataRecord as PersonRolesInfo;
      if(pDataRec.noPrsnAcctMra && pDataRec.noPrsnAcctMrp && pDataRec.noPrsnAcctWcs && pDataRec.noPrsnAcctGhprp){
          return true;
      } 
      return false;
    }

    //Setup node relationships
    acctPersonInfoNode.addChildNode(acctPersonActionDecisionNode);
    deleteAcctPrsnNode.addChildNode(acctPersonInfoNode);
    rootNode.addChildNode(deleteAcctPrsnNode);

    return new TaskTree(rootNode);
  }

}


