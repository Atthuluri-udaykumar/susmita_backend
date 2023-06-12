import { describe, expect, test, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IAuthorisedRepService } from '../../src/services/interfaces/authorised-rep-service.interface';
import { AuthorisedRepService } from '../../src/services/authorised-rep.service';
import { Symbols } from '../../src/utils/types';
import { http } from '../../src/utils/http';

describe('Test AuthrorizedRep Service', () => {
    let container: Container;
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
            } /* =============ONLY for testing n-ROWS logic ==================*/ 
            else if (url === '/accounts/CRCP/accountId/137898') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result": [
                            {
                                "acctPrsnId": 2162,
                                "prsnId": 10232,
                                "acctId": 137898,
                                "roleId": 2,
                                "recAddTs": "2019-01-23T13:29:05.000Z",
                                "recAddUserName": "EDIRp01",
                                "recUpdtTs": "2019-01-23T13:29:05.000Z",
                                "recUpdtUserName": "EDIRp01",
                                "aplctnName": "CRCP"
                            },
                            {
                                "acctPrsnId": 2651,
                                "prsnId": 12283,
                                "acctId": 137898,
                                "roleId": 3,
                                "recAddTs": "2023-03-21T14:36:16.000Z",
                                "recAddUserName": "el765el",
                                "recUpdtTs": "2023-03-21T14:36:16.000Z",
                                "recUpdtUserName": "el765el",
                                "aplctnName": "CRCP"
                            },
                            {
                                "acctPrsnId": 2756,
                                "prsnId": 12388,
                                "acctId": 137898,
                                "roleId": 3,
                                "recAddTs": "2023-05-04T11:59:01.000Z",
                                "recAddUserName": "el765el",
                                "recUpdtTs": "2023-05-04T11:59:01.000Z",
                                "recUpdtUserName": "el765el",
                                "aplctnName": "CRCP"
                            }
                        ]
                    }
                });
            } else if (url === '/persons/10232') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "prsnId": 10232,
                                "prsn1stName": "SCOTT",
                                "prsnMdlInitlName": "m",
                                "prsnLastName": "BIRMINGHAM",
                                "birthDt": null,
                                "jobTitleDesc": "Changed4",
                                "emailAdr": "fake@notphi.com",
                                "telNum": "41112345671234",
                                "faxNum": "3011234567",
                                "line1Adr": "1 W Pennsylvania Ave",
                                "line2Adr": "Test host files 0404",
                                "cityName": "Tampa",
                                "stateId": 12,
                                "zip5Cd": "11117",
                                "zipPlus4Cd": "4321",
                                "loginId": "el765el",
                                "vldtnStusId": 2,
                                "ssn": null,
                                "recAddTs": "2016-08-10T15:19:12.196Z",
                                "recAddUserName": "MRADZServer",
                                "recUpdtTs": "2023-05-24T09:40:35.898Z",
                                "recUpdtUserName": "el765el",
                                "lastLoginTs": "2023-05-24T09:40:35.473Z",
                                "wcsRoleId": 7,
                                "faildLoginCnt": 1,
                                "faildLoginTs": "2023-05-23T09:45:59.031Z",
                                "mrpRoleId": 7,
                                "ghpRoleId": 7,
                                "adSw": "Y"
                            }
                        ]
                    }
                });
            } else if (url === '/persons/12283') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "prsnId": 12283,
                                "prsn1stName": "DevAD",
                                "prsnMdlInitlName": null,
                                "prsnLastName": "Account",
                                "birthDt": null,
                                "jobTitleDesc": null,
                                "emailAdr": "crcp_ad_dev@test-team.cobqa.com",
                                "telNum": null,
                                "faxNum": null,
                                "line1Adr": null,
                                "line2Adr": null,
                                "cityName": null,
                                "stateId": null,
                                "zip5Cd": null,
                                "zipPlus4Cd": null,
                                "loginId": null,
                                "vldtnStusId": 1,
                                "ssn": null,
                                "recAddTs": "2023-03-21T14:36:16.394Z",
                                "recAddUserName": "el765el",
                                "recUpdtTs": "2023-03-21T14:36:16.394Z",
                                "recUpdtUserName": "el765el",
                                "lastLoginTs": "1970-01-01T00:00:00.000Z",
                                "wcsRoleId": null,
                                "faildLoginCnt": null,
                                "faildLoginTs": "1970-01-01T00:00:00.000Z",
                                "mrpRoleId": null,
                                "ghpRoleId": 7,
                                "adSw": "Y"
                            }
                        ]
                    }
                });
            } else if (url === '/persons/10232/rre') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "rrePrsnId": 5226,
                                "prsnId": 10232,
                                "rptrId": 22703,
                                "roleId": 2,
                                "emailScrtyTokenId": null,
                                "prsnlScrtyId": null,
                                "pndngRplcSw": null,
                                "recAddTs": "2010-11-23T11:26:13.747Z",
                                "recAddUserName": "MRA1234",
                                "recUpdtTs": "2023-04-21T15:16:54.806Z",
                                "recUpdtUserName": "el765el",
                                "rreStusId": null,
                                "pndngPrmteSw": null,
                                "rptrName": "TEST CNT TESTING 11                     "
                            },
                            {
                                "rrePrsnId": 6920,
                                "prsnId": 10232,
                                "rptrId": 23163,
                                "roleId": 2,
                                "emailScrtyTokenId": null,
                                "prsnlScrtyId": null,
                                "pndngRplcSw": null,
                                "recAddTs": "2013-04-02T12:43:24.743Z",
                                "recAddUserName": "EDIRP10",
                                "recUpdtTs": "2014-09-30T13:54:50.397Z",
                                "recUpdtUserName": "BA111TE",
                                "rreStusId": null,
                                "pndngPrmteSw": null,
                                "rptrName": "Test name company                       "
                            },
                            {
                                "rrePrsnId": 12584,
                                "prsnId": 10232,
                                "rptrId": 22899,
                                "roleId": 2,
                                "emailScrtyTokenId": "xdhk-htMhMbMBF",
                                "prsnlScrtyId": "123",
                                "pndngRplcSw": null,
                                "recAddTs": "2016-06-27T11:17:30.509Z",
                                "recAddUserName": "EDIRP10",
                                "recUpdtTs": "2016-07-06T10:28:17.789Z",
                                "recUpdtUserName": "ac111ma",
                                "rreStusId": null,
                                "pndngPrmteSw": null,
                                "rptrName": "ABEL, WALTER L                          "
                            },
                            {
                                "rrePrsnId": 13260,
                                "prsnId": 10232,
                                "rptrId": 25905,
                                "roleId": 2,
                                "emailScrtyTokenId": null,
                                "prsnlScrtyId": null,
                                "pndngRplcSw": null,
                                "recAddTs": "2018-08-01T14:11:44.592Z",
                                "recAddUserName": "EDIRP04",
                                "recUpdtTs": "2022-01-24T16:25:02.288Z",
                                "recUpdtUserName": "el765el",
                                "rreStusId": null,
                                "pndngPrmteSw": null,
                                "rptrName": "CENTRAL MUTUAL INSURANCE COMPANY        "
                            },
                            {
                                "rrePrsnId": 13640,
                                "prsnId": 10232,
                                "rptrId": 22703,
                                "roleId": 2,
                                "emailScrtyTokenId": null,
                                "prsnlScrtyId": null,
                                "pndngRplcSw": null,
                                "recAddTs": "2019-12-11T12:09:18.255Z",
                                "recAddUserName": "MRA1234",
                                "recUpdtTs": "2023-04-21T15:16:55.505Z",
                                "recUpdtUserName": "el765el",
                                "rreStusId": null,
                                "pndngPrmteSw": null,
                                "rptrName": "TEST CNT TESTING 11                     "
                            }
                        ]
                    }
                });
            } else if (url === '/persons/12283/rre') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result":[
                            {
                                "rrePrsnId": 13640,
                                "prsnId": 12283,
                                "rptrId": 22703,
                                "roleId": 1,
                                "emailScrtyTokenId": null,
                                "prsnlScrtyId": null,
                                "pndngRplcSw": null,
                                "recAddTs": "2019-12-11T12:09:18.255Z",
                                "recAddUserName": "MRA1234",
                                "recUpdtTs": "2023-04-21T15:16:55.505Z",
                                "recUpdtUserName": "el765el",
                                "rreStusId": null,
                                "pndngPrmteSw": null,
                                "rptrName": "TEST CNT TESTING 11                     "
                            }
                        ]
                    }
                });
            } else if (url === '/persons/12283/accounts') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result": [
                            {
                                "acctPrsnId": 2651,
                                "prsnId": 12283,
                                "acctId": 137898,
                                "roleId": 3,
                                "recAddTs": "2023-03-21T14:36:16.000Z",
                                "recAddUserName": "el765el",
                                "recUpdtTs": "2023-03-21T14:36:16.000Z",
                                "recUpdtUserName": "el765el",
                                "aplctnName": "CRCP"
                            }
                        ]
                    }
                });
            } else if (url === '/persons/10232/accounts') {
                return Promise.resolve({
                    data: {
                        "status": 200,
                        "errors": [],
                        "result": [
                            {
                                "acctPrsnId": 2162,
                                "prsnId": 10232,
                                "acctId": 137898,
                                "roleId": 2,
                                "recAddTs": "2019-01-23T13:29:05.000Z",
                                "recAddUserName": "EDIRp01",
                                "recUpdtTs": "2019-01-23T13:29:05.000Z",
                                "recUpdtUserName": "EDIRp01",
                                "aplctnName": "CRCP"
                            },
                            {
                                "acctPrsnId": 2506,
                                "prsnId": 10232,
                                "acctId": 137838,
                                "roleId": 2,
                                "recAddTs": "2021-03-01T14:13:18.000Z",
                                "recAddUserName": "EDIRP04",
                                "recUpdtTs": "2021-03-01T14:13:18.000Z",
                                "recUpdtUserName": "EDIRP04",
                                "aplctnName": "CRCP"
                            },
                            {
                                "acctPrsnId": 2479,
                                "prsnId": 10232,
                                "acctId": 142820,
                                "roleId": 2,
                                "recAddTs": "2020-12-21T12:17:48.000Z",
                                "recAddUserName": "EDIRP04",
                                "recUpdtTs": "2020-12-21T12:17:48.000Z",
                                "recUpdtUserName": "EDIRP04",
                                "aplctnName": "MRP"
                            },
                            {
                                "acctPrsnId": 2125,
                                "prsnId": 10232,
                                "acctId": 141299,
                                "roleId": 3,
                                "recAddTs": "2019-01-08T12:37:47.000Z",
                                "recAddUserName": "AM777WC",
                                "recUpdtTs": "2019-01-08T12:37:47.000Z",
                                "recUpdtUserName": "AM777WC",
                                "aplctnName": "WCS"
                            },
                            {
                                "acctPrsnId": 2145,
                                "prsnId": 10232,
                                "acctId": 141314,
                                "roleId": 3,
                                "recAddTs": "2019-01-24T13:44:24.000Z",
                                "recAddUserName": "WC777AM",
                                "recUpdtTs": "2019-01-24T13:44:24.000Z",
                                "recUpdtUserName": "WC777AM",
                                "aplctnName": "WCS"
                            }
                        ]
                    }
                });
            }
        });        
    });

    afterAll(() => {
        axiosGetSpy.mockRestore();
    });

    beforeEach(() => {
        container = new Container();
        container.bind<IAuthorisedRepService>(Symbols.IPersonInfoService).to(AuthorisedRepService);

        service = container.resolve( AuthorisedRepService);

    });

    test('Service should initialize successfully', () => {
        expect(service).toBeDefined();
    });

    test('Service should return valid response', async () => {
        let result = await service.findARbyRptrId("7899");
       
        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });

    /*
    test('nRows Service should return valid response', async () => {
        let result = await service.findARbyAcctId("ghprp","137898");
       
        expect(axiosGetSpy).toBeCalled();
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });*/
    
});

