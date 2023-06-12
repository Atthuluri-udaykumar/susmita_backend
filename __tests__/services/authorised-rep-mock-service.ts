import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { Container } from 'inversify';
import 'reflect-metadata';
import { IAuthorisedRepService } from '../../src/services/interfaces/authorised-rep-service.interface';
import { AuthorisedRepMockService } from '../../src/services/mock/authorised-rep-mock.service';
import { Symbols } from '../../src/utils/types';

describe('Test AuthorisedRep Service', () => {

    let container: Container;
    let service: AuthorisedRepMockService;

    beforeEach(() => {
        container = new Container();
        container.bind<IAuthorisedRepService>(Symbols.IAuthorisedRepService).to(AuthorisedRepMockService);

        service = container.resolve( AuthorisedRepMockService);

    });

    test('Service should initialize successfully', () => {
        expect(service).toBeDefined();
    });

    test('Service should return valid response for rreid', async () => {
        let result = await service.findARbyRptrId("7899");
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });

    test('Service should return valid response for email', async () => {
        let result = await service.findARbyEmail("123@abc.com");
       
        expect(service).toBeDefined();
        expect(result).toBeDefined();
    });
    
});

