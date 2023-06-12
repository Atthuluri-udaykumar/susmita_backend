
import { describe, expect, test, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { createResponse, createRequest } from 'node-mocks-http';
import 'reflect-metadata';

import { Symbols } from '../../src/utils/types';
import { http } from '../../src/utils/http';
import { Container } from 'inversify';
import { PersonInfoController } from '../../src/controllers/person-info.controller';
import { PersonInfoService } from '../../src/services/person-info.service';
import { IPersonInfoService } from '../../src/services/interfaces/person-info-service.interface';

describe('Test PersonInfo Controller', () => {
    let container: Container;
    let controller: PersonInfoController ;
    let service: PersonInfoService;
    const axiosGetSpy = jest.spyOn(http, 'get');
    const axiosPostSpy = jest.spyOn(http, 'post');
    const testUser ={ memberOf: undefined, badPasswordTime: 0, badPwdCount: 0,email:"", firstName: "tester",lastName:"",lockoutTime: 0,loginTimeStamp: null, middleName: "",personId: 0,pwdLastSet: 0, userName:"tester" };

    beforeAll(() => {
        jest.resetModules();

        axiosGetSpy.mockImplementation(async (url) => {
            //console.log('[prsn-cntrl] [GET]= ' + url);
            if ((url === '/persons?loginid=abc123') || (url === '/persons?email=123@abc.com')) {
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
            } else if (url === '/persons/1234/questions') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "prsnId": 10232,
                                "qstnCdId": 1,
                                "qstnAswrTxt": "abcdefgh",
                            },
                            {
                                "prsnId": 10232,
                                "qstnCdId": 12,
                                "qstnAswrTxt":"bumblebee"
                            }
                        ]
                    }
                });
            } else if (url === '/persons/1234/rre') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            { rrePrsnId: 123, roleId: 3 },
                            { rrePrsnId: 456, roleId: 3 },
                        ]
                    }
                });
            } else if (url === '/api/v1/submitters/123@abc.com') {
                return Promise.resolve({
                    data: [
                            {
                                "systemIndicator": "G",
                                "role": "AR",
                                "id": 137838,
                                "name": "ACTIVE - LOCAL 328",
                                "status": "A"
                            },
                            {
                                "systemIndicator": "G",
                                "role": "AM",
                                "id": 137898,
                                "name": "GROUP HEALTH INCOPORATED",
                                "status": "A"
                            },
                            {
                                "systemIndicator": "S",
                                "role": "AD",
                                "id": 22703,
                                "name": "TEST CNT TESTING 11",
                                "status": "P"
                            }
                        ]
                });
            } else if (url === '/persons?loginid=multiple') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result": [
                            {
                            prsnId: 123485,
                            prsn1stName: 'John1',
                            prsnMdlInitlName: 'William',
                            prsnLastName: 'Doe1',
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
                            },
                            {
                            prsnId: 985443,
                            prsn1stName: 'John2',
                            prsnMdlInitlName: 'William',
                            prsnLastName: 'Doe2',
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
            } else if (url === '/persons?loginid=boom') {
                return Promise.reject({
                    status: 500,
                    errors: [{message: 'test-boom exception!'}]
                });
            }
        });        
        
        axiosPostSpy.mockImplementation(async (url) => {
            //console.log('[prsn-cntrl] [POST]= ' + url);
            if (url === '/api/v1/users/mfa-id-proofing') {
                return Promise.resolve({
                    data: {
                        systemIndicator: '',
                        action: '',
                        personId: '1234',
                        sbmtrId: '',
                        mfaStatus: '',
                        failedCount: '0',
                        referenceNumber: '',
                        failedDate: '',
                        failedReason: null,
                        email: '123@abc.com',
                        mfaStatusDescription: '',
                        mfaStatusDate: '12/05/2022'
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
        container.bind<IPersonInfoService>(Symbols.IPersonInfoService).to(PersonInfoService);
        service = container.resolve( PersonInfoService);
        controller = new PersonInfoController(service);
    });

    test('Test with only loginId', async () => {
        const request = createRequest({ query: { loginid: "abc123"} });
        const response = createResponse(); 
        
        controller.findPersonByLoginOrEmail(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test with only email', async () => {
        const request = createRequest({ query: { email: "123@abc.com"} });
        const response = createResponse(); 
        
        controller.findPersonByLoginOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test with loginId not found', async () => {
        const request = createRequest({ query: { loginid: "dummy"} });
        const response = createResponse(); 
        
        controller.findPersonByLoginOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    }); 
    test('Test without loginId or email', async () => {
        const request = createRequest({ query: {} });
        const response = createResponse(); 
        
        controller.findPersonByLoginOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(400);
        expect(response.json).toBeDefined();
    });
    test('Test not unique', async () => {
        const request = createRequest({ query: { loginid: "multiple"} });
        const response = createResponse(); 
        
        controller.findPersonByLoginOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test exception', async () => {
        const request = createRequest({ query: { loginid: "boom"} });
        const response = createResponse(); 
        
        controller.findPersonByLoginOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test action with missing data', async () => {
        const request = createRequest({ body: {} });
        const response = createResponse(); 
        
        controller.updatePerson(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(400);
        expect(response.json).toBeDefined();
    });
    test('Test Id-Proof action', async () => {
        //fetch data
        let prsnInfo = await service.find(testUser ,null, "abc123");

        //set action flag
        prsnInfo.actionInfo.actionIdProofUser = true;

        //call controller
        const request = createRequest({ body: prsnInfo });
        const response = createResponse(); 
        controller.updatePerson(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });    
  
});



