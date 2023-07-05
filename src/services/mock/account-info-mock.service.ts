import { inject, injectable } from 'inversify';
import { IAccountInfoService } from '../interfaces/account-info-service.interface';
import { AccountInfo } from '../../models/account-info.model';
import { User } from '../../types/custom';
import { AccountActivity } from '../../models/account-activity.model';
import { AppType } from '../../models/apptypes.model';

@injectable()
export class AccountInfoMockService implements IAccountInfoService {
  findAccountByEIN(user: User, appType: AppType, ein: number | null): Promise<AccountInfo> {
    return this.fetchMockAccountInfo();
  }
  findAccountByAccountId(user: User, appType: AppType, accountId: number | null): Promise<AccountInfo> {
    return this.fetchMockAccountInfo();
  }
  findAccountBySSN(user: User, appType: AppType, ssn: number | null): Promise<AccountInfo> {
    return this.fetchMockAccountInfo();
  }
  fetchAccountActivity<T extends AccountActivity>(user: User, appType: AppType, accountId: number | null): Promise<T[]> {
    const activity: any[] = [
                {
                    "activityId": "001",
                    "activityDate": "2023-01-12",
                    "userId": "Register",
                    "letterId": "",
                    "activityDescription": "PIN Request",
                    "caseId": "",
                    "defenseType": "",
                    "defenseTypeDesc": null
                },
                {
                    "activityId": "001",
                    "activityDate": "2023-01-11",
                    "userId": "Register",
                    "letterId": "",
                    "activityDescription": "PIN Request",
                    "caseId": "",
                    "defenseType": "",
                    "defenseTypeDesc": null
                },
                {
                    "activityId": "001",
                    "activityDate": "2023-01-11",
                    "userId": "Register",
                    "letterId": "",
                    "activityDescription": "PIN Request",
                    "caseId": "",
                    "defenseType": "",
                    "defenseTypeDesc": null
                },
                {
                    "activityId": "001",
                    "activityDate": "2023-01-11",
                    "userId": "Register",
                    "letterId": "",
                    "activityDescription": "PIN Request",
                    "caseId": "",
                    "defenseType": "",
                    "defenseTypeDesc": null
                },
                {
                    "activityId": "001",
                    "activityDate": "2022-12-20",
                    "userId": "Register",
                    "letterId": "",
                    "activityDescription": "PIN Request",
                    "caseId": "",
                    "defenseType": "",
                    "defenseTypeDesc": null
                },
                {
                    "activityId": "001",
                    "activityDate": "2022-12-20",
                    "userId": "Register",
                    "letterId": "",
                    "activityDescription": "PIN Request",
                    "caseId": "",
                    "defenseType": "",
                    "defenseTypeDesc": null
                },
                {
                    "activityId": "001",
                    "activityDate": "2022-12-20",
                    "userId": "Register",
                    "letterId": "",
                    "activityDescription": "PIN Request",
                    "caseId": "",
                    "defenseType": "",
                    "defenseTypeDesc": null
                }
            ];
    return Promise.resolve(activity);
  }

  submitAction(user: User, appType: AppType, submitterAction: AccountInfo): Promise<AccountInfo> {
    return this.fetchMockAccountInfo();
  }

  private fetchMockAccountInfo(): Promise<AccountInfo> {
    const accountInfo: AccountInfo =  {
      "submitterInfo": {
          "id": 123445,
          "name": "DEV WCMSAP CORP TESTING ACCT",
          "addr1": "01 Testing Lane",
          "addr2": "",
          "city": "Baltimore",
          "state": "MD",
          "zip": "21226",
          "type": "C",
          "pin": "",
          "ein": 56789,
          "status": "I",
          "arFname": "First",
          "arLname": "Last",
          "arMinit": "",
          "arSsn": "0",
          "arTitle": "WCS AR",
          "arEmail": "WCS_AR_0405@test-team.cobqa.com",
          "arPhone": "4102457455",
          "arExt": "",
          "arFax": "",
          "clmLname": "",
          "clmFinit": "",
          "clmHicn": "",
          "clmSsn": "0",
          "clmDob": "0",
          "clmGender": "",
          "regDt": "20230405",
          "mailDt": "0",
          "valdInd": "",
          "updtOper": "Register",
          "updtDt": "20230405",
          "partyId": "",
          "partyType": "",
          "systemInd": "W",
          "subType": "",
          "amEmail": "",
          "paperlessInd": "",
          "paperlessEmail": "",
          "paperlessCcAd": true,
          "paperlessIndicator": false,
          "paperlessOptInDate": "",
          "paperlessOptOutDate": "",
          "mfaStatus": "",
          "amPersonId":1234,
          "arDelete": "",
      },
      "contactInfo": {
        "accountId": 123445,
          "name": "DEV WCMSAP CORP TESTING ACCT",
          "pin": "",
          "pinStatus": "Unlocked",
          "ein": 56789,
          "einLocked": "",
          "email": "WCS_AR_0405@test-team.cobqa.com",
          "statusDescription": "Initial Registration",
          "address": {
              "streetLine1": "01 Testing Lane",
              "streetLine2": "",
              "city": "Baltimore",
              "state": "MD",
              "zip": "21226"
          }
      },
      "arPersonInfo": {
          "jobTitle": "Account Representative (AR)",
          "email": "WCS_AR_0405@test-team.cobqa.com",
          "phone": "4102457455",
          "phoneExt": "",
          "fax": "",
          "ssn": "0",
          "firstName": "First",
          "middleName": "",
          "lastName": "Last"
      },
      "amPersonInfo": {
          "jobTitle": "Account Manager",
          "email": "",
          "phone": "",
          "phoneExt": "",
          "fax": "",
          "ssn": "",
          "firstName": "",
          "middleName": "",
          "lastName": "",
          "deleteIndicator": ""
      },
      "goPaperlessInfo": {
          "indicator": "",
          "jobTitle": "",
          "emailAddress": ""
      },
      "displayInfo": {
          "showGoPaperlessDetails": false,
          "showARInfo": true,
          "showAMInfo": true,
          "optionViewAccountActvity": true,
          "optionResendProfileReport": true,
          "optionRemoveSubmitter": true,
          "optionVetSubmitter": true,
          "optionGrantFullFunctions": false,
          "optionResetPin": false,
          "optionUnlockPin": false,
          "optionPaperlessEmails": false,
          "optionPaperlessParties": false
      },
      "actionInfo": {
          "status": 200,
          "errors": [],
          "txnLogs": [],
          "actionViewAccountActvity": false,
          "actionResendProfileReport": false,
          "actionRemoveSubmitter": false,
          "actionVetSubmitter": false,
          "actionGrantFullFunctions": false,
          "actionResetPin": false,
          "actionUnlockPin": false,
          "actionPaperlessEmails": false,
          "actionGoPaperlessParties": false
      }
  };

    return Promise.resolve(accountInfo);
  }

  fetchPartiesData(user: User, accountId: number| null): Promise<[]> {
    return Promise.resolve([]);
  }

  emailNotification(user: User, accountId: number | null, emailFrom: string | null, emailTo: string | null): Promise<[]> {
    return Promise.resolve([]);
  }

  downloadEmail(user: User, appType: AppType, emailImageId: string | null): Promise<[]> {
    return Promise.resolve([]);
  }

  
}
