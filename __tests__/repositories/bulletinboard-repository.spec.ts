
import { describe, expect, test, beforeEach,beforeAll, afterAll, jest } from '@jest/globals';
import { Container } from 'inversify';
import { http } from '../../src/utils/http';
import 'reflect-metadata';
import { IBulletinBoardRepository } from '../../src/repositories/interfaces/bulletinboard-repository.interface';
import { BulletinBoardRepository } from '../../src/repositories/bulletinboard-respository';
import { Symbols } from '../../src/utils/types';
import { EdiMessage } from '../../src/models/edi-message.model';
import { User } from '../../src/types/custom';



describe('Test BulletinBoard Repository', () => {
    let container: Container;
    let repository: IBulletinBoardRepository;

    let BULLETINBOARD_URI = (new BulletinBoardRepository()).BULLETINBOARD_URI;

    const httpGetSpy = jest.spyOn(http, 'get');
    const httpPostSpy = jest.spyOn(http, 'post');
    const testUser ={ memberOf: undefined, badPasswordTime: 0, badPwdCount: 0,email:"", firstName: "tester",lastName:"",lockoutTime: 0,loginTimeStamp: null, middleName: "",personId: 0,pwdLastSet: 0, userName:"tester" };
    
    beforeAll(() => {
        jest.resetModules();

        container = new Container();
        container.bind<BulletinBoardRepository>(BulletinBoardRepository).to(BulletinBoardRepository);
        repository = container.resolve(BulletinBoardRepository);

        httpPostSpy.mockImplementation(async (url) => {
            if ((url === BULLETINBOARD_URI) ) {
                return Promise.resolve();
            }
        });

        httpGetSpy.mockImplementation(async (url) => {
            if ((url === BULLETINBOARD_URI + '?latest=true') || (url === BULLETINBOARD_URI) ) {
                return Promise.resolve({
                    data: {
                            "status": 200,
                            "result": [
                                {
                                    "application": "",
                                    "message": "REST Test of successful message"
                                },
                                {
                                    "application": "Section 111",
                                    "message": "Section 111 will be evacuated"
                                },
                                {
                                    "application": "WCMSAP",
                                    "message": "Dont forget to bring your umbrella"
                                },
                                {
                                    "application": "CRCP",
                                    "message": "New Message"
                                },
                                {
                                    "application": "ECRS",
                                    "message": "TEST MESSAGE New"
                                },
                                {
                                    "application": "MSPRP",
                                    "message": "MSPRP Message"
                                }
                            ],
                            "timestamp": "2023-03-23T17:24:18.970Z"
                        }                    
                });
            } 
        });        
    });

    afterAll(() => {
        httpGetSpy.mockRestore();
        httpPostSpy.mockRestore();
    });

    beforeEach(() => {
        
    });

    test('Repository should initialize successfully', () => {
        console.log('test repo init');
        expect(repository).toBeDefined();
    });

    test('FetchLatest should return valid response', async () => {
        console.log('test fetchLatest');
        let result = await repository.fetchLatest();
       
        expect(httpGetSpy).toBeCalled();
        expect(repository).toBeDefined();
        expect(result).toBeDefined();
    });
    
    test('FetchAll should return valid response', async () => {
        console.log('test fetchAll');
        let result = await repository.fetchAll();
       
        expect(httpGetSpy).toBeCalled();
        expect(repository).toBeDefined();
        expect(result).toBeDefined();
    });

    test('UpdateMessage should return valid response',  async () => {
       
        console.log('test updateMessage');

        const messages: EdiMessage[] = [{application: 'test', message: 'this is only a test'},{application: 'test2', message: 'this is only a test'}];
        const user: User = testUser;

        console.log('calling update');
        await repository.updateMessages(user, messages);
       
        expect(httpPostSpy).toBeCalled();
        expect(repository).toBeDefined();

    });

});

