import { describe, expect, test, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IPersonInfoService } from '../../src/services/interfaces/person-info-service.interface';
import { PersonInfoService } from '../../src/services/person-info.service';
import { Symbols } from '../../src/utils/types';
import { http } from '../../src/utils/http';
import { MirPrsn } from '../../src/models/mir-prsn.model';

describe('Test PersonInfo Service', () => {
    let container: Container;
    let service: PersonInfoService;
    const axiosGetSpy = jest.spyOn(http, 'get');
    const axiosPostSpy = jest.spyOn(http, 'post');
    const axiosPutSpy = jest.spyOn(http, 'put');

    const testUser ={ memberOf: undefined, badPasswordTime: 0, badPwdCount: 0,email:"", firstName: "tester",lastName:"",lockoutTime: 0,loginTimeStamp: null, middleName: "",personId: 0,pwdLastSet: 0, userName:"tester" };
    
    beforeAll(() => {
        jest.resetModules();

        axiosGetSpy.mockImplementation(async (url) => {
            //console.log('[prsn-srvc] [GET]= ' + url);
            if ((url === '/persons?loginid=abc123') 
                || (url === '/persons?email=123@abc.com')) {
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
            } else if (url === '/persons?loginid=xyz789') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                            prsnId: 7890,
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
                            vldtnStusId: 3,
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
            } else if (url === '/api/v1/submitters/123@abc.com') {
                return Promise.resolve({
                    data: [
                            {
                                "systemIndicator": "G",
                                "role": "AM",
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
                                "role": "AM",
                                "id": 22703,
                                "name": "TEST CNT TESTING 11",
                                "status": "P"
                            }
                        ]
                });
            } else if (url === '/api/v1/users/get_ar_info/xyz123@ayz.com') {
                return Promise.resolve({
                    data: {
                    "firstName": "First",
                    "middleName": "",
                    "lastName": "Last",
                    "email": "xyz123@ayz.com",
                    "status": "I"
                    }
                });
            }
        });        

        axiosPostSpy.mockImplementation(async (url) => {
            //console.log('[prsn-srvc] [POST]= ' + url);
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

        axiosPutSpy.mockImplementation(async (url, body) => {
            //console.log({'post-mock': body});
            if (url === '/persons') {
                const reqBody = body as MirPrsn;
                if(reqBody.prsnId === 1234) {
                    return Promise.resolve({
                        data: {
                            "status": 200,
                            "errors": [],
                            "result": {
                                "rowsAffected": 1
                            },
                            "timestamp": "2023-04-17T23:25:50.235Z"
                        }
                    });
                } else if (reqBody.prsnId === 7890) {
                    return Promise.resolve({
                        data: {
                            "status": 200,
                            "errors": [],
                            "result": {
                                "rowsAffected": 0
                            },
                            "timestamp": "2023-04-17T23:25:50.235Z"
                        }
                    });
                }
            }

        }); 
    });

    afterAll(() => {
        axiosGetSpy.mockRestore();
        axiosPostSpy.mockRestore();
        axiosPutSpy.mockRestore();
    });

    beforeEach(() => {
        container = new Container();
        container.bind<IPersonInfoService>(Symbols.IPersonInfoService).to(PersonInfoService);

        service = container.resolve( PersonInfoService);

    });

    test('Service should initialize successfully', () => {
        expect(service).toBeDefined();
    });

    test('Service-findByLoginId should return valid response', async () => {
        let result = await service.find(testUser,null, "abc123");
       
        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });

    test('Service-findByEmail should return valid response', async () => {
        let result = await service.find(testUser,"xyz123@ayz.com", "");
       
        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    test('Service-idProofAction should return valid response', async () => {
        let prsnInfo = await service.find(testUser,null, "abc123");

        prsnInfo.actionInfo.actionIdProofUser = true;
        let result = await service.update(testUser, prsnInfo);

        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    test('Service-restartIdProofAction should return valid response', async () => {
        let prsnInfo = await service.find(testUser,null, "abc123");

        prsnInfo.actionInfo.actionRestartIdProof = true;
        let result = await service.update(testUser, prsnInfo);

        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    test('Service-reactivateUserAction should return valid response', async () => {
        let prsnInfo = await service.find(testUser,null, "abc123");

        prsnInfo.actionInfo.actionReactivate = true;
        let result = await service.update(testUser, prsnInfo);

        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });  
    test('Service-reactivateUserAction-Rejection', async () => {
        expect.assertions(2);
        let prsnInfo = await service.find(testUser,null, "xyz789");

        prsnInfo.actionInfo.actionReactivate = true;
        await service.update(testUser, prsnInfo)
                    .catch(e => {
                        //console.log("State: ", e);
                        expect(e.actionInfo.errors.length > 0).toBeTruthy;
                    });

        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
    });   
    
});

