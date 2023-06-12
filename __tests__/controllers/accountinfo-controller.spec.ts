
import { describe, expect, test, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { createResponse, createRequest } from 'node-mocks-http';
import 'reflect-metadata';

import { Symbols } from '../../src/utils/types';
import { http } from '../../src/utils/http';
import { Container } from 'inversify';
import { AccountInfoController } from '../../src/controllers/account-info.controller';
import { IAccountInfoService } from '../../src/services/interfaces/account-info-service.interface';
import { AccountInfoService } from '../../src/services/account-info.service';
import { AccountInfo } from '../../src/models/account-info.model';
import { Submitter } from '../../src/models/submitter.model';
import { AppType } from '../../src/models/apptypes.model';

describe('Test AccountInfo Controller', () => {
    let container: Container;
    let controller: AccountInfoController ;
    let service: AccountInfoService;
    const axiosGetSpy = jest.spyOn(http, 'get');
    const axiosPostSpy = jest.spyOn(http, 'post');
    const testUser ={ memberOf: undefined, badPasswordTime: 0, badPwdCount: 0,email:"", firstName: "tester",lastName:"",lockoutTime: 0,loginTimeStamp: null, middleName: "",personId: 0,pwdLastSet: 0, userName:"tester" };

    beforeAll(() => {
        jest.resetModules();
    
        axiosPostSpy.mockImplementation(async (url) => {
            //console.log('[prsn-cntrl] [POST]= ' + url);
            if (url === '/api/v1/users/submitters/actions/I/system-indicators/W') {
                return Promise.resolve({
                    data: {
                        "id": "137908",
                        "name": "DEV WCMSAP CORP TESTING ACCT",
                        "addr1": "01 Testing Lane",
                        "addr2": "",
                        "city": "Baltimore",
                        "state": "MD",
                        "zip": "21226",
                        "type": "C",
                        "pin": "",
                        "ein": "789863214",
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
                        "subType": null,
                        "amEmail": null,
                        "paperlessInd": "",
                        "paperlessEmail": null,
                        "paperlessCcAd": true,
                        "paperlessIndicator": false,
                        "paperlessOptInDate": null,
                        "paperlessOptOutDate": null,
                        "mfaStatus": null,
                        "amPersonId": null,
                        "arDelete": null
                    }
                });
            } else if (url === '/api/v1/users/submitters/actions/I/system-indicators/M') {
                return Promise.resolve({
                    data: {
                        "id": "137911",
                        "name": "MSP DEV CORP TESTING ACCT",
                        "addr1": "One West Pennsylvania Ave",
                        "addr2": "",
                        "city": "Towson",
                        "state": "MD",
                        "zip": "21204",
                        "type": "C",
                        "pin": "",
                        "ein": "745575655",
                        "status": "I",
                        "arFname": "First",
                        "arLname": "Last",
                        "arMinit": "",
                        "arSsn": "0",
                        "arTitle": "MSP AR",
                        "arEmail": "MSP_DEV_AR_0405@test-team.cobqa.com",
                        "arPhone": "4102547445",
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
                        "systemInd": "M",
                        "subType": null,
                        "amEmail": null,
                        "paperlessInd": "",
                        "paperlessEmail": null,
                        "paperlessCcAd": true,
                        "paperlessIndicator": false,
                        "paperlessOptInDate": null,
                        "paperlessOptOutDate": null,
                        "mfaStatus": null,
                        "amPersonId": null,
                        "arDelete": null
                    }
                });
            } else if (url === '/api/v1/users/edi/submitter/G/98765/I') {
                return Promise.resolve({
                    data: {
                        "userId": "EDI_UI",
                        "action": "I",
                        "sbmtrId": "137898",
                        "sbmtrPin": "3333",
                        "sbmtrType": "I",
                        "sbmtrStatus": "A",
                        "ein": "135511997",
                        "corpName": "GROUP HEALTH INCOPORATED",
                        "mailAddr1": null,
                        "mailAddr2": null,
                        "mailCity": null,
                        "mailState": null,
                        "mailZip5": null,
                        "mailZip4": null,
                        "arFirstNm": "AR",
                        "arLastNm": "Name",
                        "arMidInit": "",
                        "arSsn": "0",
                        "arTitle": "AR",
                        "arEmail": "AR11172022@test-team.cobqa.com",
                        "arPhone": "4435555555",
                        "arExt": "",
                        "arFax": "",
                        "mailDt": null,
                        "regDt": "2022-11-17T05:00:00.000Z",
                        "systemInd": "G",
                        "filler": null,
                        "amPersonId": "10232",
                        "arDeleteInd": null,
                        "letterId": null,
                        "letterType": null,
                        "profileId": null,
                        "ppnDueDate": null,
                        "defnsCaseId": null,
                        "demndDebtAmtDue": null,
                        "flag": null,
                        "paperlessEmailAddr": "",
                        "paperlessInd": "Y",
                        "paperlessOptInDate": "",
                        "paperlessOptOutDate": ""
                    }
                });
            }
        }); 

        axiosGetSpy.mockImplementation(async (url) => {
            if (url === '/persons/1234') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                            prsnId: 1234,
                            prsn1stName: 'John',
                            prsnMdlInitlName: 'William',
                            prsnLastName: 'Doe',
                            birthDt: '01/01/1988',
                            jobTitleDesc: '',
                            emailAdr: '123@abc.com',
                            telNum: '800-555-5678',
                            faxNum: '',
                            line1Adr: '123 main st.',
                            line2Adr: '',
                            cityName: 'austin',
                            stateId: 0,
                            zip5Cd: '78701',
                            zipPlus4Cd: '',
                            loginId: 'abc123',
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
                            }
                        ]
                    }
                });
            } else if (url === '/api/v1/submitters/accountActivity?ediReq=true&submitterId=78901') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "activityId": "003",
                                "activityDt": "2022-09-23",
                                "actvUserId": "BR777YA",
                                "activityCd": "001",
                                "firstName":  "bumble",
                                "lasstName":  "bee",
                                "activityDescription": "Request Letter Access",
                            },
                            {
                                "activityId": "019",
                                "activityDt": "2022-09-23",
                                "actvUserId": "BR777YA",
                                "activityCd": "006",
                                "activityDescription": "Electronic Payment Submitted",
                                "firstName":  "jhonny",
                                "lasstName":  "luck",
                            },
                            {
                                "activityId": "023",
                                "activityDate": "2022-09-22",
                                "userId": "DE621MO",
                                "activityCd": "003",
                                "activityDescription": "Requested an Open Debt Report",
                                "firstName":  "jhonny",
                                "lasstName":  "luck",
                            },
                        ]
                    }
                });
            } else if (url === '/api/v1/users/crc/submitter/98765/activity') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "activityId": "003",
                                "activityDate": "2022-09-23",
                                "userId": "BR777YA",
                                "letterId": "202208400000166",
                                "activityDescription": "Request Letter Access",
                                "caseId": "",
                                "defenseType": "",
                                "defenseTypeDesc": null
                            },
                            {
                                "activityId": "019",
                                "activityDate": "2022-09-23",
                                "userId": "BR777YA",
                                "letterId": "202208400000346",
                                "activityDescription": "Electronic Payment Submitted",
                                "caseId": "",
                                "defenseType": "",
                                "defenseTypeDesc": null
                            },
                            {
                                "activityId": "023",
                                "activityDate": "2022-09-22",
                                "userId": "DE621MO",
                                "letterId": "",
                                "activityDescription": "Requested an Open Debt Report",
                                "caseId": "",
                                "defenseType": "",
                                "defenseTypeDesc": null
                            }
                        ]
                    }
                });
            }
        });        
    });

    afterAll(() => {
        axiosGetSpy.mockRestore();
        axiosPostSpy.mockRestore();
    });

    beforeEach(() => {
        container = new Container();
        container.bind<IAccountInfoService>(Symbols.IAuthorisedRepService).to(AccountInfoService);
        service = container.resolve( AccountInfoService);
        controller = new AccountInfoController(service);
    });

    test('Test with only WCS-ACCTID', async () => {
        const request = createRequest({ query: { appType: "WCS", accountId: "7899"} });
        const response = createResponse(); 
        
        controller.findAccountByEinAccountIdSsn(request, response, () => { return; });

       // expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test with only MRP-ACCTID', async () => {
        const request = createRequest({ query: {  appType: "MRP", accountId: "7899"} });
        const response = createResponse(); 
        
        controller.findAccountByEinAccountIdSsn(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test with only WCS-EIN', async () => {
        const request = createRequest({ query: {  appType: "WCS", ein: "7899"} });
        const response = createResponse(); 
        
        controller.findAccountByEinAccountIdSsn(request, response, () => { return; });

       // expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test with only MRP-EIN', async () => {
        const request = createRequest({ query: {  appType: "MRP", accountId: "7899"} });
        const response = createResponse(); 
        
        controller.findAccountByEinAccountIdSsn(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    }); 
    test('Test without accountId or ein', async () => {
        const request = createRequest({ query: { appType: "WCS"} });
        const response = createResponse(); 
        
        controller.findAccountByEinAccountIdSsn(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(400);
        expect(response.json).toBeDefined();
    });
    test('Test with accountId but no appType ', async () => {
        const request = createRequest({ query: { accountId: "7899"} });
        const response = createResponse(); 
        
        controller.findAccountByEinAccountIdSsn(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(400);
        expect(response.json).toBeDefined();
    });
    test('Test with MRP-ACCT-ACTVTY', async () => {
        const acctInfo: AccountInfo = new AccountInfo();
        const request = createRequest({ query: { appType: "WCS"} , body: acctInfo});
        const response = createResponse(); 
         
        //set action flag
        acctInfo.submitterInfo = new Submitter();
        acctInfo.submitterInfo.id = 78901;
        acctInfo.actionInfo.actionViewAccountActvity = true;

        controller.submitAction(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    }); 
    test('Test with GHPRP-ACCT-ACTVTY', async () => {
        /*const request = createRequest({ query: {  appType: "GHPRP", accountId: "98765"} });
        const response = createResponse(); 
        
        controller.fetchAccountActivity(request, response, () => { return; });*/
        const acctInfo: AccountInfo = new AccountInfo();
        const request = createRequest({ query: { appType: "GHPRP"} , body: acctInfo});
        const response = createResponse(); 
         
        //set action flag
        acctInfo.submitterInfo = new Submitter();
        acctInfo.submitterInfo.id = 98765;
        acctInfo.actionInfo.actionViewAccountActvity = true;

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    }); 
    test('Test MRP GrantFullFunctions action', async () => {
        //fetch data
        let acctInfo = await service.findAccountByAccountId(testUser, AppType.MRP,78901);

        //set action flag
        acctInfo.actionInfo.actionGrantFullFunctions = true;

        //call controller
        const request = createRequest({ query: {  appType: "WCS"} , body: acctInfo});
        const response = createResponse(); 

        controller.submitAction(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });    
    test('Test GHPRP Unlock-PIN action', async () => {
        //fetch data
        let acctInfo = await service.findAccountByAccountId(testUser, AppType.GHPRP,98765);

        //set action flag
        acctInfo.actionInfo.actionUnlockPin = true;

        //call controller
        const request = createRequest({ query: {  appType: "GHPRP"} , body: acctInfo});
        const response = createResponse(); 

        controller.submitAction(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    }); 
});



