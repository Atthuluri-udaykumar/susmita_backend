import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IAccountInfoService } from '../../src/services/interfaces/account-info-service.interface';
import { AccountInfoMockService } from '../../src/services/mock/account-info-mock.service';
import { Symbols } from '../../src/utils/types';
import { AppType } from '../../src/models/apptypes.model';

describe('Test AccountInfo Mock Service', () => {

    let container: Container;
    let service: AccountInfoMockService;
    const testUser ={ memberOf: undefined, badPasswordTime: 0, badPwdCount: 0,email:"", firstName: "tester",lastName:"",lockoutTime: 0,loginTimeStamp: null, middleName: "",personId: 0,pwdLastSet: 0, userName:"tester" };
    
    beforeEach(() => {
        container = new Container();
        container.bind<IAccountInfoService>(Symbols.IAccountInfoService).to(AccountInfoMockService);

        service = container.resolve( AccountInfoMockService);

    });

    test('Service should initialize successfully', () => {
        expect(service).toBeDefined();
    });
    test('Service WCS-ACCTID-SRCH should return valid response', async () => {
        let result = await service.findAccountByAccountId(testUser, AppType.WCS,78901);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    test('Service MRP-ACCTID-SRCH should return valid response', async () => {
        let result = await service.findAccountByAccountId(testUser, AppType.MRP,78901);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });  
    test('Service MRP-ACCTID-SRCH should return valid PapperLess=Y type=S response', async () => {
        let result = await service.findAccountByAccountId(testUser, AppType.MRP,34567);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });  
    test('Service GHPRP-ACCTID-SRCH should return valid response', async () => {
        let result = await service.findAccountByAccountId(testUser, AppType.GHPRP,98765);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    test('Service WCS-EIN-SRCH should return valid response', async () => {
        let result = await service.findAccountByEIN(testUser, AppType.WCS,78901);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    test('Service MRP-EIN-SRCH should return valid response', async () => {
        let result = await service.findAccountByEIN(testUser, AppType.MRP,78901);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    test('Service MRP-EIN-SRCH should return valid PapperLess=Y type=S response', async () => {
        let result = await service.findAccountByEIN(testUser, AppType.MRP,34567);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    }); 
    test('Service Acct-Actvty should return valid response', async () => {
        let result = await service.fetchAccountActivity(testUser, AppType.MRP,78901);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    test('Service submitResponse should return valid response', async () => {
        let acctInfo = await service.findAccountByAccountId(testUser, AppType.MRP,78901);
        let result = await service.submitAction(testUser, AppType.MRP,acctInfo);
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
});

