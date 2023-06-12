import { inject, injectable } from 'inversify';
import { EdiResponse } from '../../models/edi-respose.model';
import { PersonInfo } from '../../models/person-info.model';
import { User } from '../../types/custom';
import { IPersonInfoService } from '../interfaces/person-info-service.interface';

@injectable()
export class PersonInfoMockService implements IPersonInfoService {
  find(user: User, email: string|null, loginId: string|null): Promise<PersonInfo> {
    const prsnInfo: PersonInfo = new PersonInfo();
    prsnInfo.person = {
      prsnId: 1234,
      prsn1stName: 'John',
      prsnMdlInitlName: 'William',
      prsnLastName: 'Doe',
      birthDt: '01/01/1988',
      jobTitleDesc: '',
      emailAdr: 'john.w.doe@gmail.com',
      telNum: '800-555-5678',
      faxNum: '',
      line1Adr: '123 main st.',
      line2Adr: '',
      cityName: 'austin',
      stateId: 0,
      zip5Cd: '78701',
      zipPlus4Cd: '',
      loginId: 'JA777YA',
      vldtnStusId: 1,
      ssn: '',
      recAddTs: '',
      recAddUserName: '',
      recUpdtTs: '',
      recUpdtUserName: '',
      lastLoginTs: '01/01/2021 11:10 AM',
      wcsRoleId: 0,
      faildLoginCnt: 0,
      faildLoginTs: '',
      mrpRoleId: 0,
      ghpRoleId: 0,
      adSw: 'Y',
    };

    prsnInfo.qstnList = [
      { prsnId: 1234, qstnCdId: 1, qstnAswrTxt: 'puppy' },
      { prsnId: 1234, qstnCdId: 2, qstnAswrTxt: 'zillo' },
    ];

    prsnInfo.idProof =  {
      "systemIndicator": "",
      "action": "",
      "personId": 1234,
      "sbmtrId": "",
      "mfaStatus": "",
      "failedCount": "0",
      "referenceNumber": "",
      "failedDate": "",
      "failedReason": "",
      "email": "john.w.doe@gmail.com",
      "mfaStatusDescription": "",
      "mfaStatusDate": "12/05/2022"
   };

   prsnInfo.sbmtrList = [
      {
          "systemIndicator": "G",
          "role": "AM",
          "id": 137838,
          "name": "ACTIVE - LOCAL 328",
          "status": "A",
          "appName": "CRCP",
          "roleName": "Account Manager",
          "acctStatusName": "Active"
      },
      {
          "systemIndicator": "G",
          "role": "AM",
          "id": 137898,
          "name": "GROUP HEALTH INCOPORATED",
          "status": "A",
          "appName": "CRCP",
          "roleName": "Account Manager",
          "acctStatusName": "Active"
      },
      {
          "systemIndicator": "S",
          "role": "AM",
          "id": 22703,
          "name": "TEST CNT TESTING 11",
          "status": "P",
          "appName": "Section 111 MRA",
          "roleName": "Account Manager",
          "acctStatusName": "Production"
      }
    ];

    return Promise.resolve(prsnInfo);
  }

  update(user: User, personAction: PersonInfo): Promise<PersonInfo> {

    if(personAction.actionInfo.actionIdProofUser){
      personAction.idProof =  {
        "systemIndicator": "",
        "action": "",
        "personId": 1234,
        "sbmtrId": "",
        "mfaStatus": "E",
        "failedCount": "0",
        "referenceNumber": "",
        "failedDate": "",
        "failedReason": "",
        "email": "john.w.doe@gmail.com",
        "mfaStatusDescription": "",
        "mfaStatusDate": "12/05/2022"
      };
    }
    
    return Promise.resolve(personAction);
  }
}
