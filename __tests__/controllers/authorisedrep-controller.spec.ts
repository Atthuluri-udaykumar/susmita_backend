
import { describe, expect, test, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { createResponse, createRequest } from 'node-mocks-http';
import 'reflect-metadata';

import { Symbols } from '../../src/utils/types';
import { http } from '../../src/utils/http';
import { Container } from 'inversify';
import { AuthorisedRepController } from '../../src/controllers/authorised-rep.controller';
import { AuthorisedRepService } from '../../src/services/authorised-rep.service';
import { IAuthorisedRepService } from '../../src/services/interfaces/authorised-rep-service.interface';

describe('Test AuthorisedRep Controller', () => {
    let container: Container;
    let controller: AuthorisedRepController ;
    let service: AuthorisedRepService;
    const axiosGetSpy = jest.spyOn(http, 'get');

    beforeAll(() => {
        jest.resetModules();

        axiosGetSpy.mockImplementation(async (url) => {
            //console.log('[prsn-cntrl] [GET]= ' + url);
            if (url === '/persons?email=123@abc.com') {
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
            } else if (url === '/persons/3456') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                            prsnId: 3456,
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
            } else if (url === '/reporters/7899') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "rptrId": 7899,
                                "rptrEin": "6755655  ",
                                "ragtEin": null,
                                "rptrStatusCd": "P",
                                "rptrTypeId": 2,
                                "rptrGhpOptCd": "B",
                                "rptrName": "TEST CNT TESTING 11                     ",
                                "rptrAddr1": "1235 SKIPPY DR                          ",
                                "rptrAddr2": "TESTING ADDR4  RRE1                     ",
                                "rptrCity": "Cockeysville                  ",
                                "rpterAdrStateId": 24,
                                "rptrZip5": "21156",
                                "rptrZip4": "4444",
                                "rptrPhoneNo": "6716767621",
                                "rptrFaxNo": "1231231232",
                                "rptrEdiRepId": 2793,
                                "rptrSbmssnPer": "  ",
                                "rptrPrtdSubCd": null,
                                "rptrRdsSubSw": " ",
                                "rpterRdsPlanNum": "    ",
                                "rptrEntRespCd": "B",
                                "rptrHewSftwrCd": " ",
                                "rptrAtstnAckSw": " ",
                                "rptrRxBin": "      ",
                                "rptrRxPcn": "          ",
                                "rptrTroopRxBin": "      ",
                                "rptrTroopRxPcn": "          ",
                                "rptrCvrdOv45Cnt": 18000,
                                "rptrNaicNum": "     ",
                                "rptrPinNum": 1234,
                                "rptrPrtDSw": " ",
                                "recAddTs": "2010-11-23T07:28:42.393Z",
                                "recAddUserName": "EL765EL",
                                "recUpdtTs": "2023-04-20T13:54:17.535Z",
                                "recUpdtUserName": "el765el",
                                "rptrDdeInd": "Y",
                                "rptrHraInd": "N",
                                "rptrUnsolInd": "0",
                                "rptrLoadInd": "N",
                                "rptrOffDt": null
                            }
                        ]
                    }
                });
            } else if (url === '/accounts/mra?rptrId=7899') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "rrePrsnId": 5225,
                                "prsnId": 3456,
                                "rptrId": 7899,
                                "roleId": 1,
                                "emailScrtyTokenId": null,
                                "prsnlScrtyId": null,
                                "pndngRplcSw": null,
                                "recAddTs": "2010-11-23T07:28:47.781Z",
                                "recAddUserName": "MRA1234",
                                "recUpdtTs": "2023-04-20T13:54:17.623Z",
                                "recUpdtUserName": "el765el",
                                "rreStusId": null,
                                "pndngPrmteSw": null
                            },
                            {
                                "rrePrsnId": 5226,
                                "prsnId": 10232,
                                "rptrId": 7899,
                                "roleId": 2,
                                "emailScrtyTokenId": null,
                                "prsnlScrtyId": null,
                                "pndngRplcSw": null,
                                "recAddTs": "2010-11-23T11:26:13.747Z",
                                "recAddUserName": "MRA1234",
                                "recUpdtTs": "2023-04-20T13:54:17.682Z",
                                "recUpdtUserName": "el765el",
                                "rreStusId": null,
                                "pndngPrmteSw": null
                            },
                            {
                                "rrePrsnId": 7123,
                                "prsnId": 7356,
                                "rptrId": 7899,
                                "roleId": 3,
                                "emailScrtyTokenId": "jmpJZwNZlMtNMh",
                                "prsnlScrtyId": " ",
                                "pndngRplcSw": null,
                                "recAddTs": "2013-07-26T12:07:56.708Z",
                                "recAddUserName": "el234el",
                                "recUpdtTs": "2023-04-20T13:54:17.740Z",
                                "recUpdtUserName": "el765el",
                                "rreStusId": null,
                                "pndngPrmteSw": null
                            },
                            {
                                "rrePrsnId": 9737,
                                "prsnId": 7792,
                                "rptrId": 7899,
                                "roleId": 3,
                                "emailScrtyTokenId": null,
                                "prsnlScrtyId": " ",
                                "pndngRplcSw": null,
                                "recAddTs": "2014-03-19T15:50:13.853Z",
                                "recAddUserName": " ",
                                "recUpdtTs": "2023-04-20T13:54:17.813Z",
                                "recUpdtUserName": "el765el",
                                "rreStusId": null,
                                "pndngPrmteSw": null
                            },
                            {
                                "rrePrsnId": 13661,
                                "prsnId": 11671,
                                "rptrId": 7899,
                                "roleId": 3,
                                "emailScrtyTokenId": "g7UhbhBhNFFBZw",
                                "prsnlScrtyId": " ",
                                "pndngRplcSw": null,
                                "recAddTs": "2020-02-17T15:55:22.036Z",
                                "recAddUserName": "el765el",
                                "recUpdtTs": "2023-04-20T13:54:17.843Z",
                                "recUpdtUserName": "el765el",
                                "rreStusId": null,
                                "pndngPrmteSw": null
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
            } else if (url === '/persons/3456/rre') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            { 
                                rrePrsnId: 123, 
                                prsnId: 3456, 
                                rptrId: 7, 
                                roleId: 2, 
                                recAddTs: "2009-04-07T16:57:08.487Z",
                                recAddUserName: "MRADZServer",
                                recUpdtTs: "2009-04-07T16:57:08.487Z",
                                recUpdtUserName: "MRADZServer",
                                rreStusId: null
                            },
                            { 
                                rrePrsnId: 456, 
                                prsnId: 3456, 
                                rptrId: 8, 
                                roleId: 3, 
                                recAddTs: "2009-04-07T16:57:08.487Z",
                                recAddUserName: "MRADZServer",
                                recUpdtTs: "2009-04-07T16:57:08.487Z",
                                recUpdtUserName: "MRADZServer",
                                rreStusId: null
                            }
                        ]
                    }
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
    });

    afterAll(() => {
        axiosGetSpy.mockRestore();
    });

    beforeEach(() => {
        container = new Container();
        container.bind<IAuthorisedRepService>(Symbols.IAuthorisedRepService).to(AuthorisedRepService);
        service = container.resolve( AuthorisedRepService);
        controller = new AuthorisedRepController(service);
    });

    test('Test with only rreid', async () => {
        const request = createRequest({ query: { rreid: "7899"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

       // expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test with only email', async () => {
        const request = createRequest({ query: { email: "123@abc.com"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        //expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
    test('Test with email not found', async () => {
        const request = createRequest({ query: { email: "iam@dummy.com"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    }); 
    test('Test without rreid or email', async () => {
        const request = createRequest({ query: {} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(400);
        expect(response.json).toBeDefined();
    });
    /*test('Test not unique', async () => {
        const request = createRequest({ query: { rreid: "multiple"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });*/
    test('Test exception', async () => {
        const request = createRequest({ query: { rreid: "boom"} });
        const response = createResponse(); 
        
        controller.findReporterByRreOrEmail(request, response, () => { return; });

        expect(axiosGetSpy).toBeCalled();
        expect(response.statusCode).toBe(200);
        expect(response.json).toBeDefined();
    });
  
});



