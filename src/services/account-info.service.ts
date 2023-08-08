import { inject, injectable } from 'inversify';
import { IAccountInfoService } from './interfaces/account-info-service.interface';
import { AccountInfo, PersonRolesActionStatusDetails } from '../models/account-info.model';
import { Submitter } from '../models/submitter.model';
import { User } from '../types/custom';
import { MirPrsn } from '../models/mir-prsn.model';
import { CobDataResolverService } from './cob-data-resolver-service';
import { MraDataResolverService } from './mra-data-resolver-service';
import { AccountActivity } from '../models/account-activity.model';
import { isEmptyObject } from '../utils/model.util';
import { DataFormatUtils } from '../utils/data-format.utils';
import { RandomUtils } from '../utils/random-util';
import { EmailService } from './email.service';
import { AppType } from '../models/apptypes.model';
import { IRemoveAccountService } from './interfaces/remove-account-service.interface';
import { Symbols } from '../utils/types';

@injectable()
export class AccountInfoService implements IAccountInfoService {
  SRCH_TYP_ACCTID = 'ACCT';
  SRCH_TYP_EIN = 'EIN';
  SRCH_TYP_SSN = 'SSN';
  MRP_NULL_USER = 6;
  WCS_NULL_USER = 5;

  constructor(@inject(Symbols.IRemoveAccountService) private removeAcctService: IRemoveAccountService) { }

  public async findAccountByAccountId(user: User, appType: AppType, accountId: number | null): Promise<AccountInfo> {
    let acctInfo: AccountInfo = new AccountInfo();

    const response: any = await this.findSubmitter(user, appType, accountId, null);

    if (response && !isEmptyObject(response)) {
      if (response.error) {
        return Promise.reject(response.error);
      }

      if (!(
        ((appType == AppType.MRP) && (response.systemInd === 'M'))
        || ((appType == AppType.WCS) && (response.systemInd === 'W'))
        || ((appType == AppType.GHPRP) && (response.systemInd === 'G'))
      )
      ) {
        acctInfo.submitterInfo = 'Account ID and Application Type (WCS or MSPRP or CRCP) doesn\'t match' as any;
        return Promise.resolve(acctInfo);
      }

      let prsnInfo: any = null;
      if (response.amPersonId) {
        prsnInfo = await this.findAMPersonInfo(response.amPersonId);
      }

      acctInfo = this.formatSearchResponse(appType, this.SRCH_TYP_ACCTID, response, prsnInfo);
    } else {
      acctInfo.submitterInfo = 'Account ID was not found' as any;
    }

    return Promise.resolve(acctInfo);
  }

  public async findAccountByEIN(user: User, appType: AppType, ein: number | null): Promise<AccountInfo> {
    let acctInfo: AccountInfo = new AccountInfo();

    if (appType == AppType.GHPRP) {
      acctInfo.submitterInfo = 'EIN lookup is not available for CRCP' as any;
      return Promise.resolve(acctInfo);
    }

    const response: any = await this.findSubmitter(user, appType, null, ein);
    if (response && !isEmptyObject(response)) {
      if (response.error) {
        return Promise.reject(response.error);
      }

      let prsnInfo: any = null;
      if (response.amPersonId) {
        prsnInfo = await this.findAMPersonInfo(response.amPersonId);
      }

      acctInfo = this.formatSearchResponse(appType, this.SRCH_TYP_EIN, response, prsnInfo);
    } else {
      acctInfo.submitterInfo = 'Employer Identification Number(EIN) was not found' as any;
    }

    return Promise.resolve(acctInfo);
  }

  public async findAccountBySSN(user: User, appType: AppType, ssn: number | null): Promise<AccountInfo> {
    throw new Error('Method not implemented.');
  }

  public async fetchAccountActivity<T extends AccountActivity>(user: User, appType: AppType, accountId: number | null): Promise<T[]> {
    const cobDataResolver = new CobDataResolverService<T>(user);
    let reqURL = (appType == AppType.GHPRP) ?
      `/api/v1/users/crc/submitter/${accountId}/activity`
      : `/api/v1/submitters/accountActivity?ediReq=true&submitterId=${accountId}`;
    try {
      //call endpoint
      const response = (appType === AppType.GHPRP) ?
        await cobDataResolver.getDataArray(reqURL) : await cobDataResolver.postData(reqURL);

      //handle response
      if (!response) {
        return Promise.reject({
          status: 200,
          error: 'fetchAccountActivity: Unknown error'
        });
      }

      return Promise.resolve(response as T[]);

    } catch (error) {
      return Promise.reject({ status: 500, error: error });
    }
  }

  public async fetchPartiesData<T extends AccountActivity>(user: User, accountId: number | null): Promise<T[]> {
    const cobDataResolver = new CobDataResolverService<T>(user);
    let reqURL = `/api/v1/users/get-parties/${accountId}`;
    try {
      //call endpoint
      const response = await cobDataResolver.getDataArray(reqURL);

      //handle response
      if (!response) {
        return Promise.reject({
          status: 200,
          error: 'fetchAccountActivity: Unknown error'
        });
      }
      return Promise.resolve(response as T[]);

    } catch (error) {
      return Promise.reject({ status: 500, error: error });
    }
  }

  public async emailNotification<T extends AccountActivity>(user: User, accountId: number | null, emailFrom: string | null, emailTo: string | null): Promise<T[]> {
    const cobDataResolver = new CobDataResolverService<T>(user);
    let reqURL = `/api/v1/correspondences/email_notifications?accountId=${accountId}&emailFrom=${emailFrom}&emailTo=${emailTo}`;
    try {
      //call endpoint
      const response = await cobDataResolver.getDataArray(reqURL);

      //handle response
      if (!response) {
        return Promise.reject({
          status: 200,
          error: 'emailNotification: Unknown error'
        });
      }
      return Promise.resolve(response as T[]);

    } catch (error) {
      return Promise.reject({ status: 500, error: error });
    }
  }

  //Returns a PDF as a Base64 encoded string
  public async downloadEmail(user: User, appType: AppType, emailImageId: string | null): Promise<any> {
    const cobDataResolver = new CobDataResolverService<any>(user);
    let reqURL = '';
    if (appType === AppType.MRP) {
      reqURL = `/api/v1/correspondences/downloads3email?emailImageId=${emailImageId}&systemIndicator=M`;
    } else {
      reqURL = `/api/v1/correspondences/downloads3email?emailImageId=${emailImageId}`;
    }

    try {
      //call endpoint
      const response = await cobDataResolver.getData(reqURL);

      //handle response
      if (response && !isEmptyObject(response)) {
        return Promise.resolve(response);
      } else {
        return Promise.reject({
          status: 200,
          error: 'downloadEmail: Unknown error'
        });
      }

    } catch (error) {
      return Promise.reject({ status: 500, error: error });
    }
  }

  public async submitAction(user: User, appType: AppType, acctInfo: AccountInfo): Promise<AccountInfo> {
    let action: string = '';
    let accountId = acctInfo.contactInfo.accountId;
    let submtrInfo: Submitter = acctInfo.submitterInfo ? acctInfo.submitterInfo : new Submitter();
    let newPin: string = '';


    if (acctInfo.actionInfo.actionUnlockPin) {//WCUnlockPinAction.java
      submtrInfo.status = 'M';
      action = 'S';
      acctInfo.actionInfo.actionUnlockPin = false;//reset
    } else if (acctInfo.actionInfo.actionGrantFullFunctions) {//WCFullFunctionAction.java
      submtrInfo.status = 'A';
      submtrInfo.type = 'C';
      action = 'S';
      acctInfo.actionInfo.actionGrantFullFunctions = false;//reset
    } else if (acctInfo.actionInfo.actionResetPin) {//WCResetPinAction.java
      newPin = RandomUtils.generatePin(4); //Generate a 4 digit random pin; 
      submtrInfo.pin = newPin;
      action = 'P';
    } else if (acctInfo.actionInfo.actionVetSubmitter) {//WCVettingAction.java
      newPin = RandomUtils.generatePin(4); //Generate a 4 digit random pin;
      submtrInfo.pin = newPin;
      submtrInfo.status = 'M';
      action = 'V';
    } else if (acctInfo.actionInfo.actionRemoveSubmitter) {//WCRemoveSubmitterAction.java, MRAEDIAcccessServiceBean.removeSubmitter
      action = 'D';
      const mraRemovalStatuses: PersonRolesActionStatusDetails[] = await this.removeAcctService.removePersonAccountAndPerson(user, appType, accountId);
      if (Array.isArray(mraRemovalStatuses) && mraRemovalStatuses.length > 0) {
        mraRemovalStatuses.forEach(txn => acctInfo.actionInfo.txnLogs.push(txn));
        //return Promise.reject(acctInfo); 
      }
    }

    const response: any = await this.updateSubmitter(user, appType, action, accountId, submtrInfo);
    //console.log({'UPDT-SBMTR': response});
    if (response && !isEmptyObject(response)) {
      if (response.error) {
        acctInfo.actionInfo.errors.push(response.error);
        return Promise.reject(response.error);
      }

      //hack related to CRCP status not refreshing- EM283
      if (appType === AppType.GHPRP) response.sbmtrStatus = submtrInfo.status;

      if (acctInfo.actionInfo.actionResetPin || acctInfo.actionInfo.actionVetSubmitter) {
        if (acctInfo.actionInfo.actionVetSubmitter) {
          acctInfo.actionInfo.actionVetSubmitter = false;
        } else {
          acctInfo.actionInfo.actionResetPin = false;
        }
        // HACK: alter response to correct the pin assigned in response
        response.sbmtrPin = newPin;
        const pinReset: any = await EmailService.sendResetPinEmail(acctInfo.arPersonInfo, submtrInfo.pin!, appType);
        if (pinReset && !isEmptyObject(pinReset)) {
          if (pinReset.error) {
            return Promise.reject(pinReset.error);
          }
        }
      } else if (acctInfo.actionInfo.actionResendProfileReport) {
        const resendProfileReport: any = await EmailService.sendResendProfileReportEmail(acctInfo.arPersonInfo, appType);
        if (resendProfileReport && !isEmptyObject(resendProfileReport)) {
          if (resendProfileReport.error) {
            return Promise.reject(resendProfileReport.error);
          }
        }
      } else if (acctInfo.actionInfo.actionRemoveSubmitter) {
        if ((appType !== AppType.GHPRP) && response.arDelete && response.arDelete === 'Y') {
          const arPrsn: MirPrsn = await this.findARPersonInfoByEmail(acctInfo.arPersonInfo.email);
          if (arPrsn) {
            if (appType === AppType.MRP) {
              arPrsn.mrpRoleId = this.MRP_NULL_USER;
            } else {
              arPrsn.wcsRoleId = this.WCS_NULL_USER;
            }

            //Update corresponding MIR_PRSN record.
            const updPrsnResponse: any = await this.updatePersonInfo(user, arPrsn);
            acctInfo.actionInfo.txnLogs.push({ key: 'UpdPrsnInfoMrpWcsRoleId', status: updPrsnResponse });
            if (updPrsnResponse && updPrsnResponse.error) {
              acctInfo.actionInfo.errors.push(updPrsnResponse.error);
              return Promise.reject({
                status: 200,
                error: updPrsnResponse.error
              });
            }
          }
        }
        console.log({ 'RemoveSubmitter': JSON.stringify(acctInfo.actionInfo.txnLogs) });
        acctInfo.actionInfo.actionRemoveSubmitter = false;
      }

      acctInfo = this.formatUpdateResponse(appType, acctInfo, response);
    } else {
      return Promise.reject({
        status: 200,
        error: 'submitAction: Unknown error'
      });
    }

    return Promise.resolve(acctInfo);
  }

  /* -----------------------------------------------------
    Private helper methods
  */
  private async findSubmitter(user: User, appType: AppType, accountId: number | null, ein: number | null): Promise<any> {
    const cobDataResolver = new CobDataResolverService<Submitter>(user);
    let sbmtrReqData: Submitter = new Submitter();
    let reqURL = '';
    if (appType == AppType.GHPRP) {
      reqURL = `/api/v1/users/edi/submitter/G/${accountId}/I`;
    } else {
      reqURL = '/api/v1/users/submitters/actions/I/system-indicators/';
      if (accountId) {
        sbmtrReqData.id = accountId;
        sbmtrReqData.updtOper = user.userName;
        reqURL = reqURL + 'W';
      } else {
        sbmtrReqData.ein = ein;
        sbmtrReqData.updtOper = user.userName;
        sbmtrReqData.type = 'C';
        if (appType == AppType.WCS) {
          reqURL = reqURL + 'W';
        } else {
          reqURL = reqURL + 'M';
        }
      }
    }

    //call endpoint
    const srchResponse: Submitter = await cobDataResolver.postData(reqURL, sbmtrReqData);

    //handle response
    if (!srchResponse) {
      return Promise.reject({
        status: 200,
        error: 'findNonGhprpSubmitter: Unknown error'
      });
    }

    return Promise.resolve(srchResponse);
  }

  private async findAMPersonInfo(prsnId: string): Promise<any> {
    const mraDataResolver = new MraDataResolverService<MirPrsn>();

    //call endpoint
    const prsns: MirPrsn[] = await mraDataResolver.getDataArray('/persons/' + prsnId);

    //handle response
    if (!prsns || !Array.isArray(prsns)) {
      return Promise.reject({
        status: 200,
        error: 'findAMPersonInfo: Unknown error'
      });
    }
    return Promise.resolve(prsns[0]);
  }

  private async findARPersonInfoByEmail(emailId: string): Promise<any> {
    const mraDataResolver = new MraDataResolverService<MirPrsn>();

    //call endpoint
    const prsns: MirPrsn[] = await mraDataResolver.getDataArray('/persons?email=' + emailId);

    //handle response
    if (!prsns || !Array.isArray(prsns)) {
      return Promise.reject({
        status: 200,
        error: 'findARPersonInfoByEmail: Unknown error'
      });
    }
    return Promise.resolve(prsns[0]);
  }

  private formatSearchResponse(appType: AppType, srchType: string, sbmtrResponse: any, amPerson: any): AccountInfo {
    const acctInfo = new AccountInfo();
    acctInfo.submitterInfo = sbmtrResponse;
    this.formatContactInfo(srchType, appType, sbmtrResponse, acctInfo);

    //EM-269
    if (sbmtrResponse.status === 'D' || sbmtrResponse.sbmtrStatus === 'D') {
      acctInfo.displayInfo.optionResendProfileReport = false;
      acctInfo.displayInfo.optionRemoveSubmitter = false;
      acctInfo.displayInfo.showGoPaperlessDetails = false;
      if ((sbmtrResponse.type === 'R') || (sbmtrResponse.type === 'S')) {
        acctInfo.displayInfo.showARInfo = false;
      } else {
        this.formatARInfo(appType, sbmtrResponse, acctInfo);
      }
      //this.formatAMInfo(srchType, appType, sbmtrResponse, acctInfo, amPerson);
      acctInfo.displayInfo.showAMInfo = false;
      return acctInfo;
    }

    if (srchType === this.SRCH_TYP_ACCTID) {
      if (appType == AppType.GHPRP) {
        acctInfo.contactInfo.name = sbmtrResponse.corpName;
        acctInfo.arPersonInfo.jobTitle = 'Account/Authorized Representative (AR)';

        acctInfo.displayInfo.showGoPaperlessDetails = true;
        this.formatGoPaperlessInfo(appType, sbmtrResponse, acctInfo);

      } else if (((appType == AppType.MRP) && (sbmtrResponse.systemInd === 'M'))
        || ((appType == AppType.WCS) && (sbmtrResponse.systemInd === 'W'))) {
        acctInfo.amPersonInfo.jobTitle = 'Account Manager';
        if (sbmtrResponse.type === 'C') {
          acctInfo.contactInfo.name = sbmtrResponse.name || sbmtrResponse.corpName;
          acctInfo.arPersonInfo.jobTitle = 'Account Representative (AR)';
        } else if ((sbmtrResponse.type === 'R') || (sbmtrResponse.type === 'S')) {
          acctInfo.contactInfo.name = sbmtrResponse.arFname + ' ' + sbmtrResponse.arMinit + ' ' + sbmtrResponse.arLname;
          acctInfo.arPersonInfo.jobTitle = '';
          acctInfo.displayInfo.showARInfo = false;
        }

        if ((appType == AppType.MRP) && (sbmtrResponse.systemInd === 'M')) {
          acctInfo.displayInfo.showGoPaperlessDetails = true;
        }
      }

      this.formatARInfo(appType, sbmtrResponse, acctInfo);
      this.formatAMInfo(srchType, appType, sbmtrResponse, acctInfo, amPerson);

      if (sbmtrResponse.status === 'A' || sbmtrResponse.sbmtrStatus === 'A') {
        acctInfo.displayInfo.optionRemoveSubmitter = false;
      }
      if (appType == AppType.WCS || appType == AppType.MRP) {
        if (sbmtrResponse.status === 'I') {
          acctInfo.displayInfo.optionVetSubmitter = true;
        }
        if (appType == AppType.MRP) {
          this.formatGoPaperlessInfo(appType, sbmtrResponse, acctInfo);
        }
      }

    } else if (srchType === this.SRCH_TYP_EIN) {
      if (appType != AppType.GHPRP) {
        this.formatContactInfo(srchType, appType, sbmtrResponse, acctInfo);
        acctInfo.arPersonInfo.jobTitle = 'Account Representative (AR)';
        this.formatARInfo(appType, sbmtrResponse, acctInfo);
        this.formatAMInfo(srchType, appType, sbmtrResponse, acctInfo, amPerson);

        if (appType == AppType.MRP) {
          if (sbmtrResponse.systemInd === 'M') {
            acctInfo.displayInfo.showGoPaperlessDetails = true;
          }
          this.formatGoPaperlessInfo(appType, sbmtrResponse, acctInfo);
        }
      }
    }

    switch ((appType == AppType.GHPRP) ? sbmtrResponse.sbmtrStatus : sbmtrResponse.status) {
      case 'A': acctInfo.displayInfo.optionRemoveSubmitter = false; break;
      case 'I': acctInfo.displayInfo.optionVetSubmitter = true; break;
      case 'L':
      case 'M':
        acctInfo.displayInfo.optionResetPin = true;
        acctInfo.displayInfo.optionUnlockPin = true;
        break;
      case 'S': acctInfo.displayInfo.optionGrantFullFunctions = true; break;
      default: '';
    }

    return acctInfo;
  }

  private formatARInfo(appType: AppType, sbmtrResponse: any, acctInfo: AccountInfo) {
    acctInfo.arPersonInfo.firstName = (appType == AppType.GHPRP) ? sbmtrResponse.arFirstNm : sbmtrResponse.arFname;
    acctInfo.arPersonInfo.middleName = (appType == AppType.GHPRP) ? sbmtrResponse.arLastNm : sbmtrResponse.arMinit;
    acctInfo.arPersonInfo.lastName = (appType == AppType.GHPRP) ? sbmtrResponse.arMidInit : sbmtrResponse.arLname;
    acctInfo.arPersonInfo.email = sbmtrResponse.arEmail;
    acctInfo.arPersonInfo.phone = sbmtrResponse.arPhone;
    acctInfo.arPersonInfo.phoneExt = sbmtrResponse.arExt;
    acctInfo.arPersonInfo.fax = sbmtrResponse.arFax;
    acctInfo.arPersonInfo.ssn = sbmtrResponse.arSsn;
    acctInfo.arPersonInfo.deleteIndicator = (appType == AppType.GHPRP) ? sbmtrResponse.arDeleteInd : sbmtrResponse.arDelete;
  }

  private formatAMInfo(srchType: string, appType: AppType, sbmtrResponse: any, acctInfo: AccountInfo, amPerson: MirPrsn) {
    acctInfo.amPersonInfo.jobTitle = 'Account Manager';

    if (srchType === this.SRCH_TYP_EIN) {
      if (amPerson) {
        acctInfo.amPersonInfo.firstName = amPerson.prsn1stName;
        acctInfo.amPersonInfo.middleName = amPerson.prsnMdlInitlName;
        acctInfo.amPersonInfo.lastName = amPerson.prsnLastName;
        acctInfo.amPersonInfo.email = amPerson.emailAdr;

        acctInfo.amPersonInfo.phone = amPerson.telNum ? DataFormatUtils.parsePhoneExtn(amPerson.telNum).phone : '';
        acctInfo.amPersonInfo.phoneExt = amPerson.telNum ? DataFormatUtils.parsePhoneExtn(amPerson.telNum).extn : '';
      }
    } else {
      if (sbmtrResponse.type === 'S' || sbmtrResponse.sbmtrType === 'S') {
        acctInfo.amPersonInfo.firstName = (appType == AppType.GHPRP) ? sbmtrResponse.arFirstNm : sbmtrResponse.arFname;
        acctInfo.amPersonInfo.middleName = (appType == AppType.GHPRP) ? sbmtrResponse.arMidInit : sbmtrResponse.arMinit;
        acctInfo.amPersonInfo.lastName = (appType == AppType.GHPRP) ? sbmtrResponse.arLastNm : sbmtrResponse.arLname;
        acctInfo.amPersonInfo.email = sbmtrResponse.arEmail;
        acctInfo.amPersonInfo.phone = sbmtrResponse.arPhone;
        acctInfo.amPersonInfo.phoneExt = sbmtrResponse.arExt;
      } else if (amPerson) {
        acctInfo.amPersonInfo.firstName = amPerson.prsn1stName;
        acctInfo.amPersonInfo.middleName = amPerson.prsnMdlInitlName;
        acctInfo.amPersonInfo.lastName = amPerson.prsnLastName;
        acctInfo.amPersonInfo.email = amPerson.emailAdr;

        acctInfo.amPersonInfo.phone = amPerson.telNum ? DataFormatUtils.parsePhoneExtn(amPerson.telNum).phone : '';
        acctInfo.amPersonInfo.phoneExt = amPerson.telNum ? DataFormatUtils.parsePhoneExtn(amPerson.telNum).extn : '';
      }
    }
  }

  private formatContactInfo(srchType: string, appType: AppType, sbmtrResponse: any, acctInfo: AccountInfo) {
    if (srchType === this.SRCH_TYP_EIN) {
      if (appType != AppType.GHPRP) {
        acctInfo.contactInfo.name = sbmtrResponse.name;
        acctInfo.contactInfo.einLocked = sbmtrResponse.status;
      }
    }
    acctInfo.contactInfo.accountId = (appType == AppType.GHPRP) ? sbmtrResponse.sbmtrId : sbmtrResponse.id;
    acctInfo.contactInfo.statusDescription = Submitter.getWcsStatusDescription((appType == AppType.GHPRP) ?
      sbmtrResponse.sbmtrStatus
      : sbmtrResponse.status, sbmtrResponse.systemInd);
    acctInfo.contactInfo.pinStatus = Submitter.getPinStatus((appType == AppType.GHPRP) ? sbmtrResponse.sbmtrStatus : sbmtrResponse.status);
    acctInfo.contactInfo.email = sbmtrResponse.arEmail;
    acctInfo.contactInfo.ein = sbmtrResponse.ein;
    acctInfo.contactInfo.pin = (appType == AppType.GHPRP) ? sbmtrResponse.sbmtrPin : sbmtrResponse.pin;
    acctInfo.contactInfo.address.streetLine1 = (appType == AppType.GHPRP) ? sbmtrResponse.mailAddr1 : sbmtrResponse.addr1;
    acctInfo.contactInfo.address.streetLine2 = (appType == AppType.GHPRP) ? sbmtrResponse.mailAddr2 : sbmtrResponse.addr2;
    acctInfo.contactInfo.address.city = (appType == AppType.GHPRP) ? sbmtrResponse.mailCity : sbmtrResponse.city;
    acctInfo.contactInfo.address.state = (appType == AppType.GHPRP) ? sbmtrResponse.mailState : sbmtrResponse.state;
    acctInfo.contactInfo.address.zip = (appType == AppType.GHPRP) ? (sbmtrResponse.mailZip5 + '-' + sbmtrResponse.mailZip4) : sbmtrResponse.zip;

  }

  private formatGoPaperlessInfo(appType: AppType, sbmtrResponse: any, acctInfo: AccountInfo) {
    if (sbmtrResponse.paperlessInd) {
      if (sbmtrResponse.paperlessInd === 'Y') {
        acctInfo.goPaperlessInfo.indicator = 'Y';
        acctInfo.goPaperlessInfo.emailAddress = sbmtrResponse.paperlessEmail;
        acctInfo.goPaperlessInfo.optInDate = sbmtrResponse.paperlessOptInDate;
        acctInfo.goPaperlessInfo.optOutDate = sbmtrResponse.paperlessOptOutDate;
        acctInfo.displayInfo.optionPaperlessParties = (appType == AppType.MRP) ? true : false;
        acctInfo.displayInfo.optionPaperlessEmails = true;
      } else if (sbmtrResponse.paperlessInd === 'N') {
        acctInfo.goPaperlessInfo.indicator = 'N';
        acctInfo.goPaperlessInfo.optInDate = sbmtrResponse.paperlessOptInDate;
        acctInfo.goPaperlessInfo.optOutDate = sbmtrResponse.paperlessOptOutDate;
        acctInfo.displayInfo.optionPaperlessParties = (appType == AppType.MRP) ? true : false;
        acctInfo.displayInfo.optionPaperlessEmails = true;
      } else {
        acctInfo.goPaperlessInfo.indicator = 'N';
        acctInfo.goPaperlessInfo.optInDate = sbmtrResponse.paperlessOptInDate;
        acctInfo.goPaperlessInfo.optOutDate = sbmtrResponse.paperlessOptOutDate;
      }
    }
  }

  //Refer to https://github.mspsc-devops.ofm.cmscloud.local/rest/users/blob/master/src/main/java/com/gdit/controller/SubmitterController.java
  private async updateSubmitter(user: User, appType: AppType, action: string, accountId: number, submtrInfo: Submitter): Promise<Submitter> {
    const cobDataResolver = new CobDataResolverService<Submitter>(user);
    let reqURL = (appType === AppType.GHPRP) ?
      `/api/v1/users/edi/submitter/G/${accountId}/${action}`
      : `/api/v1/users/submitters/actions/${action}/system-indicators/W`;
    try {
      if (appType == AppType.GHPRP) {
        //This hack is necessary because of field name differences between Submitter and EdiGhprpSubmitter on REST Users service
        submtrInfo.sbmtrId = submtrInfo.id;
        submtrInfo.sbmtrPin = submtrInfo.pin;
        submtrInfo.sbmtrType = submtrInfo.type;
        submtrInfo.sbmtrStatus = submtrInfo.status;
        submtrInfo.corpName = submtrInfo.name;
        submtrInfo.mailAddr1 = submtrInfo.addr1;
        submtrInfo.mailAddr2 = submtrInfo.addr2;
        submtrInfo.mailCity = submtrInfo.city;
        submtrInfo.mailState = submtrInfo.state;
        submtrInfo.mailZip5 = submtrInfo.zip ? DataFormatUtils.parseZip5_4(submtrInfo.zip).zip5 : '';
        submtrInfo.mailZip4 = submtrInfo.zip ? DataFormatUtils.parseZip5_4(submtrInfo.zip).zip4 : '';
        submtrInfo.arFirstNm = submtrInfo.arFname;
        submtrInfo.arLastNm = submtrInfo.arLname;
        submtrInfo.arMidInit = submtrInfo.arMinit;
        submtrInfo.systemInd = submtrInfo.systemIndicator;

        if (action === 'D') {
          reqURL = reqURL + '?activityCode=017';
        }
      }

      //call endpoint
      const updateResponse: Submitter = await cobDataResolver.postData(reqURL, submtrInfo);
      //console.log({'updateRESTrsp' : updateResponse});
      //handle response
      if (!updateResponse) {
        return Promise.reject({
          status: 200,
          error: 'updateSubmitter: Unknown error'
        });
      }

      return Promise.resolve(updateResponse);

    } catch (error) {
      return Promise.reject({ status: 500, error: error });
    }
  }

  private formatUpdateResponse(appType: AppType, acctInfo: AccountInfo, response: any): AccountInfo {
    acctInfo.submitterInfo = response;
    acctInfo.contactInfo.statusDescription = Submitter.getWcsStatusDescription((appType == AppType.GHPRP) ?
      response.sbmtrStatus : response.status,
      response.systemInd);
    acctInfo.contactInfo.pin = (appType == AppType.GHPRP) ? response.sbmtrPin : response.pin;
    acctInfo.contactInfo.pinStatus = Submitter.getPinStatus((appType == AppType.GHPRP) ? response.sbmtrStatus : response.status);

    return acctInfo;
  }

  //Update corresponding MIR_PRSN record.
  private async updatePersonInfo(user: User, prsnInfo: MirPrsn): Promise<any> {
    const mraDataResolver = new MraDataResolverService<MirPrsn>();

    try {
      const updateResponse: any = await mraDataResolver.putData(
        '/persons',
        prsnInfo
      );

      //handle response
      if (!updateResponse || (updateResponse && updateResponse.rowsAffected < 1)) {
        Promise.reject({ status: 500, error: 'Error updating Person record' });
      }

      return Promise.resolve(updateResponse);
    } catch (error: any) {
      Promise.reject({ status: 500, error: error });
    }
  }

  //Returns a PDF as a Base64 encoded string
  public async getVettedSubmitters(user: User): Promise<any> {
    const cobDataResolver = new CobDataResolverService<any>(user);
    let reqURL = "/api/v1/submitters/vetted";
    try {
      //call endpoint
      const response = await cobDataResolver.getDataArray(reqURL);
      //handle response
      if (response && !isEmptyObject(response)) {
        return Promise.resolve(response);
      } else {
        return Promise.reject({
          status: 200,
          error: 'get vetted submitters: Unknown error'
        });
      }

    } catch (error) {
      return Promise.reject({ status: 500, error: error });
    }
  }

}