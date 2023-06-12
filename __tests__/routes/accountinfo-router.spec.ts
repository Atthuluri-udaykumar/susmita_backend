import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IAccountInfoController } from '../../src/controllers/interfaces/account-info-controller.interface';
import { AccountInfoController } from '../../src/controllers/account-info.controller';
import { IAccountInfoService } from '../../src/services/interfaces/account-info-service.interface';
import { AccountInfoService } from '../../src/services/account-info.service';
import { AccountInfoRouter } from '../../src/routes/account-info.router';
import { Symbols } from '../../src/utils/types';

describe('Test AccountInfo Router', () => {

    let container: Container;
    let router: AccountInfoRouter;
    beforeEach(() => {
        container = new Container();
        container.bind<IAccountInfoService>(Symbols.IAccountInfoService).to(AccountInfoService);
        container.bind<AccountInfoController>(Symbols.IAccountInfoController).to(AccountInfoController);
        container.bind<AccountInfoRouter>(AccountInfoRouter).to(AccountInfoRouter);
		
		router = container.resolve(AccountInfoRouter);
    });

    test('Routes should initialize successfully', () => {
        expect(router.router.stack.length > 0).toBeTruthy();
    });

    
});

