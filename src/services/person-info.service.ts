import { injectable } from 'inversify';
import { MirPrsn } from '../models/mir-prsn.model';
import { MirPrsnQstn } from '../models/mir-prsn-qstn.model';
import { MraDataResolverService } from './mra-data-resolver-service';
import { IPersonInfoService } from './interfaces/person-info-service.interface';
import { PersonInfo } from '../models/person-info.model';
import { Task } from '../models/task/task.model';
import { TaskTree } from '../models/task/task-tree.model';
import { TaskRequest } from '../models/task/task-request.model';
import { TaskResponse } from '../models/task/task-response.model';
import { TaskNode } from '../models/task/task-node.model';
import { IdProof } from '../models/id-proof.model';
import { Submitter } from '../models/submitter.model';
import { User } from '../types/custom';
import { CobDataResolverService } from './cob-data-resolver-service';
import { MirRrePrsn } from '../models/mir-rre-prsn.model';
import { http } from '../utils/http';
import { ServiceResponse } from '../models/serviceresponse.model';


@injectable()
export class PersonInfoService implements IPersonInfoService {
  TASK_PRSN_KEY = 'PersonTask';
  TASK_PRSN_FAILOVER_KEY = 'PersonFailoverTask';
  TASK_QSTN_KEY = 'QstnTask';
  TASK_RRE_KEY = 'RreTask';
  TASK_MFA_KEY = 'MfaTask';
  TASK_SBMTR_KEY = 'SbmtrTask';

  //Refer to /app/section111/blob/master/mra-common/src/main/java/gov/hhs/cms/cob/mir/common/enums/MIRRoleType.java
  ROLE_ID_AR = 1;
  ID_PROOF_MFA_STATUS = 'E';
  RESTART_ID_PROOF_MFA_STATUS = 'X';

  /*  ----------------------------------------------------
    Find a person
  */
  public async find(user: User, email: string | null, loginId: string | null): Promise<PersonInfo> {
    const taskTree: TaskTree<Task> = this.createTaskTree(user);
    if (loginId) {
      taskTree.rootNode.task.taskRequest.paramsMap.set('${param1}', 'loginid');
      taskTree.rootNode.task.taskRequest.paramsMap.set('${param2}', loginId);
    } else if (email) {
      taskTree.rootNode.task.taskRequest.paramsMap.set('${param1}', 'email');
      taskTree.rootNode.task.taskRequest.paramsMap.set('${param2}', email);
    }

    const result: Map<string, TaskResponse> = new Map<string, TaskResponse>();
    for await (const nodeRsp of taskTree.parse()) {
      /*console.log({'place': 'inside gen-iter', 
                  'key': nodeRsp.task.key, 
                  'url': nodeRsp.task.taskRequest.url, 
                  'response' : nodeRsp.task.taskResponse});*/
      result.set(nodeRsp.task.key, nodeRsp.task.taskResponse);
    }
    return this.formatTaskResponse(result);
  }

  /* ----------------------------------------------------
    Update Person based on action selected
  */
  public async update(user: User, personAction: PersonInfo): Promise<PersonInfo> {
    const personInfo: PersonInfo = new PersonInfo();

    if (personAction.actionInfo.actionIdProofUser) {
      return this.mfaProofAction(user, personAction, this.ID_PROOF_MFA_STATUS);
    } else if (personAction.actionInfo.actionRestartIdProof) {
      return this.mfaProofAction(user, personAction, this.RESTART_ID_PROOF_MFA_STATUS);
    } else if (personAction.actionInfo.actionReactivate) {
      return this.reactivateUserAction(user, personAction);
    } else if (personAction.actionInfo.actionUnlockUserAcct) {
      return this.unlockUserAction(user, personAction);
    }
    return personInfo;
  }

  /* -----------------------------------------------------
    Private helper methods
  */
  private createTaskTree(user: User): TaskTree<Task> {
    //create root node
    const prsnTask = new Task(
      this.TASK_PRSN_KEY,
      new TaskRequest('/persons?${param1}=${param2}', new Map([['${param1}', ''], ['${param2}', '']])),
      new MraDataResolverService<MirPrsn>(),
      false, //UNIQUE
    );
    //override default postProcessing method on this task
    prsnTask.postProcess = (taskResponse: TaskResponse) => {
      if (taskResponse && taskResponse.hasData()) {
        if (Array.isArray(taskResponse.result)) {
          for (let prsn of taskResponse.result) {
            if (prsn) {
              prsn.vldtnStusDesc = MirPrsn.getVldtnStusDesc(prsn.vldtnStusId);

              if (!prsnTask.allowMany) {//access the first element
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

    //create failover node
    const prsnFailoverTask = new Task(
      this.TASK_PRSN_FAILOVER_KEY,
      //replace $param1 with the value found for $param2 inside the parent-node request
      new TaskRequest('/api/v1/users/get_ar_info/${param1}', new Map([['${param1}', '${param2}']])),
      new CobDataResolverService<Submitter>(user),
      false, //UNIQUE
    );
    //Transform the data received to a MIR_PRSN object
    prsnFailoverTask.postProcess = (taskResponse: TaskResponse) => {
      if (taskResponse && taskResponse.hasData()) {
        if (taskResponse.result) {
          const prsn: MirPrsn = new MirPrsn();
          prsn.prsn1stName = taskResponse.result.firstName;
          prsn.prsnMdlInitlName = taskResponse.result.middleName;
          prsn.prsnLastName = taskResponse.result.lastName;
          prsn.emailAdr = taskResponse.result.email;
          prsn.vldtnStusId = taskResponse.result.status;
          prsn.vldtnStusDesc = MirPrsn.getVldtnStusDesc(taskResponse.result.status);
          taskResponse.result = prsn;
        }
        prsnFailoverTask.taskResponse = taskResponse;
      }
      return Promise.resolve(prsnFailoverTask);
    };
    const prsnFailoverNode = new TaskNode(prsnFailoverTask,
      true, //Is Failover Node
      'Key not found');  //failover criteria

    //create all dependent child nodes
    const qstnTaskNode: TaskNode<Task> = new TaskNode(
      new Task(
        this.TASK_QSTN_KEY,
        new TaskRequest('/persons/${param1}/questions', new Map([['${param1}', 'prsnId']])),
        new MraDataResolverService<MirPrsnQstn>(),
      ));

    // we ONLY set the user for CobDataResolverService when calling existing COB REST-API backend and not for MRA-DL
    const idProofTaskNode: TaskNode<Task> = new TaskNode(
      new Task(
        this.TASK_MFA_KEY,
        new TaskRequest('/api/v1/users/mfa-id-proofing',
          new Map([['${param1}', 'prsnId']]),
          'REST',
          'POST',
          {
            'systemIndicator': 'E',//EDI
            'action': 'I', //Inquiry
            'personId': '${param1}',
          },
        ),
        new CobDataResolverService<IdProof>(user),
      ),
    );

    const sbmtrTask = new Task(
      this.TASK_SBMTR_KEY,
      new TaskRequest('/api/v1/submitters/${param1}', new Map([['${param1}', 'emailAdr']])),
      new CobDataResolverService<Submitter>(user),
    );
    //override default postProcessing method on this task
    sbmtrTask.postProcess = (taskResponse: TaskResponse) => {
      if (taskResponse && taskResponse.hasData()) {
        if (Array.isArray(taskResponse.result)) {
          taskResponse.result.forEach((sbmtr: Submitter) => {
            sbmtr.appName = Submitter.getAppName(sbmtr.systemIndicator);
            sbmtr.roleName = Submitter.getRoleName(sbmtr.role);
            sbmtr.acctStatusName = Submitter.getAcctStatusName(sbmtr.status, sbmtr.systemIndicator);
          });
        }
        sbmtrTask.taskResponse = taskResponse;
      }
      return Promise.resolve(sbmtrTask);
    };
    const sbmtrTaskNode: TaskNode<Task> = new TaskNode(sbmtrTask);

    const rreTaskNode: TaskNode<Task> = new TaskNode(
      new Task(
        this.TASK_RRE_KEY,
        new TaskRequest('/persons/${param1}/rre', new Map([['${param1}', 'prsnId']])),
        new MraDataResolverService<MirRrePrsn>(),
      ),
    );
    /* Create node relationships:
                          [ PersonTask ] 
                        /             \
                    [pass]            [fail]
                        \                 \
                          \        [PersonTaskFailover]
                          \        /       \
                            \    [pass]    [fail]=>Stop processing
                            \   /                     
                    -----------------------------
                    |        |         |        |
              [QstnTask] [MfaTask] [SbmtrTask] [rreTask] 
    */
    //All nodes with there sub-nodes need to be defined before adding to root-node
    rootNode.addChildNode(prsnFailoverNode);
    rootNode.addChildNode(qstnTaskNode);
    rootNode.addChildNode(idProofTaskNode);
    rootNode.addChildNode(sbmtrTaskNode);
    rootNode.addChildNode(rreTaskNode);

    return new TaskTree(rootNode);
  }

  private formatTaskResponse(responseMap: Map<string, TaskResponse>): Promise<PersonInfo> {
    const personInfo: PersonInfo = new PersonInfo();

    if (responseMap && responseMap.size > 0) {
      let prsnData = responseMap.get(this.TASK_PRSN_KEY);
      if (!prsnData || !prsnData.processingSuccess() || !prsnData.hasData()) {
        prsnData = responseMap.get(this.TASK_PRSN_FAILOVER_KEY);
      }

      if (prsnData && prsnData.processingSuccess() && prsnData.hasData()) {
        personInfo.person = prsnData.result;
        personInfo.qstnList = responseMap.get(this.TASK_QSTN_KEY)?.processingSuccess() && responseMap.get(this.TASK_QSTN_KEY)?.hasData()
          ? responseMap.get(this.TASK_QSTN_KEY)?.result
          : [];//responseMap.get(this.TASK_QSTN_KEY)?.errors;
        personInfo.idProof = responseMap.get(this.TASK_MFA_KEY)?.processingSuccess() && responseMap.get(this.TASK_MFA_KEY)?.hasData()
          ? responseMap.get(this.TASK_MFA_KEY)?.result
          : {};//responseMap.get(this.TASK_MFA_KEY)?.errors;
        personInfo.sbmtrList = responseMap.get(this.TASK_SBMTR_KEY)?.processingSuccess() && responseMap.get(this.TASK_SBMTR_KEY)?.hasData()
          ? responseMap.get(this.TASK_SBMTR_KEY)?.result
          : [];//responseMap.get(this.TASK_SBMTR_KEY)?.errors;

        /*
          handle UI specific logic
        */
        if (personInfo.person) {
          personInfo.displayInfo = this.gatherDisplayInfo(personInfo.person,
            personInfo.sbmtrList,
            personInfo.idProof);
        }

        return Promise.resolve(personInfo);
      } else {
        personInfo.person = responseMap.get(this.TASK_PRSN_KEY)?.errors[0];
        return Promise.resolve(personInfo);
      }
    } else {
      return Promise.reject('Person not found');
    }
  }

  private gatherDisplayInfo(person: MirPrsn, sbmtrList: any, idProof: any): any {
    const displayInfo = {
      showIdProofDetails: false,
      optionRestartIdProof: false,
      optionIdProofUser: false,
      optionResetPwd: false,
      optionUnlockUserAcct: false,
      optionReactivate: false,
      optionSendToken: false,
    };

    if (person) {
      if ((person.mrpRoleId && person.mrpRoleId !== this.ROLE_ID_AR)
        || (person.ghpRoleId && person.ghpRoleId !== this.ROLE_ID_AR)
      ) {
        displayInfo.showIdProofDetails = true;
      }

      switch (person.vldtnStusId) {
        case MirPrsn.VLD_STUS_ACTIVE:
          displayInfo.optionResetPwd = person.loginId ? true : false; //is not null or empty
          break;
        case MirPrsn.VLD_STUS_INACTIVE:
          displayInfo.optionReactivate = true;
          break;
        case MirPrsn.VLD_STUS_LOCKED:
          displayInfo.optionResetPwd = person.loginId ? true : false;
          displayInfo.optionUnlockUserAcct = true;
          break;
        default:
          break;
      }
      //console.log(idProof);
      if (idProof) {
        if (idProof.mfaStatus) {
          if (idProof.mfaStatus === 'F' || idProof.mfaStatus === 'P') {
            displayInfo.optionRestartIdProof = true;
            if (idProof.mfaStatus === 'F') {
              displayInfo.optionIdProofUser = true;
            }
          }
        }
      }
      if (sbmtrList) {
        //find any submitter-acct with a role of AM and verify person is in pending status with a null login-id
        displayInfo.optionSendToken = ((person.loginId ? false : true) && person.vldtnStusId === MirPrsn.VLD_STUS_PENDING)
          && ((sbmtrList as Submitter[]).filter(sbmtr => sbmtr.role === 'AM')?.length > 0);
      }
    }

    return displayInfo;
  }

  /* -------------------------------------------
     Action methods
  */
  private async mfaProofAction(user: User, personInfo: PersonInfo, mfaStatus: string = 'E') {
    const cobDataResolver = new CobDataResolverService<IdProof>(user);
    try {
      //create and update request payload
      const idProof: IdProof = new IdProof();
      idProof.systemIndicator = 'E';//EDI
      idProof.action = 'U';//Update
      idProof.mfaStatus = mfaStatus; //this is the change
      idProof.personId = personInfo.person?.prsnId ? personInfo.person?.prsnId : 0;

      //call endpoint
      const updateResponse: IdProof = await cobDataResolver.postData(
        '/api/v1/users/mfa-id-proofing',
        idProof
      );

      //handle response
      if (!updateResponse) {
        personInfo.actionInfo.status = 200;
        personInfo.actionInfo.errors.push(`mfaProofAction: Unknown error trying to set mfaStatus: ${mfaStatus}`);
        return Promise.reject(personInfo);
      }

      personInfo.idProof = idProof;
      if (idProof.mfaStatus === this.ID_PROOF_MFA_STATUS) {
        personInfo.displayInfo.optionIdProofUser = false;
      } else if (idProof.mfaStatus === this.RESTART_ID_PROOF_MFA_STATUS) {
        personInfo.displayInfo.optionRestartIdProof = false;
      }
      return Promise.resolve(personInfo);

    } catch (error) {
      personInfo.actionInfo.status = 500;
      personInfo.actionInfo.errors.push(error);
      return Promise.reject(personInfo);
    }
  }

  private async reactivateUserAction(user: User, personInfo: PersonInfo) {
    const mraDataResolver = new MraDataResolverService<MirPrsn>();
    try {
      if (personInfo && personInfo.person) {
        //1.Pre-update validation
        let rreARfound: boolean = false;

        //filter out any RREs which are AR
        if (personInfo.rreList) {
          rreARfound = personInfo.rreList.filter(rre => rre.roleId == this.ROLE_ID_AR).length > 0
        }
        if (rreARfound &&
          (
            (!personInfo.person.mrpRoleId && !personInfo.person.wcsRoleId)
            ||
            (personInfo.person.mrpRoleId == this.ROLE_ID_AR && personInfo.person.wcsRoleId == this.ROLE_ID_AR)
          )
        ) {
          personInfo.actionInfo.status = 200;
          personInfo.actionInfo.errors.push('Cannot reactivate AuthRep');
          return Promise.reject(personInfo);
        }

        //2.create and update request payload
        personInfo.person.vldtnStusId = MirPrsn.VLD_STUS_ACTIVE;
        personInfo.person.faildLoginCnt = 0;
        personInfo.person.faildLoginTs = null;
        personInfo.person.lastLoginTs = null;
        personInfo.person.recUpdtUserName = user.userName;

      }

      //call endpoint
      const updateResponse: any = await mraDataResolver.putData(
        '/persons',
        personInfo.person
      );

      //handle response
      if (updateResponse && updateResponse.rowsAffected > 0) {
        personInfo.displayInfo.optionReactivate = false;
        return Promise.resolve(personInfo);
      }

      personInfo.actionInfo.errors.push('reactivateUserAction: Unknown error trying to activate user');
      return Promise.reject(personInfo);

    } catch (error) {
      personInfo.actionInfo.status = 500;
      personInfo.actionInfo.errors.push(error);
      return Promise.reject(personInfo);
    }
  }

  //EM-217
  private async unlockUserAction(user: User, personInfo: PersonInfo): Promise<any> {
    const mraDataResolver = new MraDataResolverService<MirPrsn>();
    let adldsUpdStatus: boolean = true;
    let mraUpdStatus: boolean = false;

    try {
      if (personInfo?.person) {
        //1.create and update request payload
        personInfo.person.vldtnStusId = MirPrsn.VLD_STUS_ACTIVE;
        personInfo.person.faildLoginCnt = 0;
        personInfo.person.faildLoginTs = null;
        personInfo.person.recUpdtUserName = user.userName;
      }
      //call endpoint
      const updateResponse: any = await mraDataResolver.putData(
        '/persons',
        personInfo.person
      );
    
      //handle response
      if (updateResponse && updateResponse.rowsAffected > 0) {
        mraUpdStatus = true;
        personInfo.displayInfo.optionReactivate = false;
        if( personInfo.person) {
          personInfo.person.vldtnStusDesc = MirPrsn.getVldtnStusDesc(MirPrsn.VLD_STUS_ACTIVE);
        }
      } else {
        personInfo.actionInfo.errors.push(`Error updating user record - adldsStatus:${adldsUpdStatus} mraStatus:${mraUpdStatus}`);
        return Promise.reject(personInfo);
      }

      
      //Update ADLDS
      /*
        Once unlockUser support gets added to COB_AUTH, this call will get added
        If update to ADLDS is successfull ONLY then the next update will get executed
          adldsUpdStatus = true;
      */
      if (adldsUpdStatus) {
        const unlockUserRes: any = await http.put<any, ServiceResponse>(
          '/cob-auth/login',
          {
            "username": user.userName,
            "unlockUserAccount": 1
          }
        );

        //handle response
        if (unlockUserRes?.status === 200 && unlockUserRes?.data?.result?.lockoutTime == '0') {
          personInfo.displayInfo.optionUnlockUserAcct = true;
          return Promise.resolve(personInfo);
        }
        personInfo.actionInfo.errors.push(`Error updating adlds -  adldsStatus:${adldsUpdStatus} mraStatus:${mraUpdStatus}`);
        return Promise.reject(personInfo);
      }
    } catch (error) {
      personInfo.actionInfo.status = 500;
      personInfo.actionInfo.errors.push(error);
      return Promise.reject(personInfo);
    }
  }
}

