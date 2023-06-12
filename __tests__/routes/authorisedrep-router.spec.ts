import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IAuthorisedRepController } from '../../src/controllers/interfaces/authorised-rep-controller.interface';
import { AuthorisedRepController } from '../../src/controllers/authorised-rep.controller';
import { IAuthorisedRepService } from '../../src/services/interfaces/authorised-rep-service.interface';
import { AuthorisedRepRouter } from '../../src/routes/authorised-rep.router';
import { Symbols } from '../../src/utils/types';
import { AuthorisedRepService } from '../../src/services/authorised-rep.service';

describe('Test AuthorisedRep Router', () => {

    let container: Container;
    let router: AuthorisedRepRouter;
    beforeEach(() => {
        container = new Container();
        container.bind<IAuthorisedRepService>(Symbols.IAuthorisedRepService).to(AuthorisedRepService);
        container.bind<IAuthorisedRepController>(Symbols.IAuthorisedRepController).to(AuthorisedRepController);
        container.bind<AuthorisedRepRouter>(AuthorisedRepRouter).to(AuthorisedRepRouter);
		
		router = container.resolve(AuthorisedRepRouter);
    });

    test('Routes should initialize successfully', () => {
        expect(router.router.stack.length > 0).toBeTruthy();
    });

    
});

