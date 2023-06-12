import { describe, expect, test, beforeEach } from '@jest/globals';

import {RandomUtils} from '../../src/utils/random-util';

describe('Test random utils ', () => {


    beforeEach(() => {
        // serviceMock = new CobAcntActvtyServiceMock();
    });

    test('generate pin 4', () => {

        const result = RandomUtils.generatePin(4);
        console.log( result);

        expect(result.length).toEqual(4);
    });

    test('generate pin 2', () => {

        const result = RandomUtils.generatePin(2);
        console.log( result);

        expect(result.length).toEqual(2);
    });

    test('generate pin 6', () => {

        const result = RandomUtils.generatePin(6);
        console.log( result);

        expect(result.length).toEqual(6);
    });

    test('generate pin 10', () => {

        const result = RandomUtils.generatePin(10);
        console.log( result);

        expect(result.length).toEqual(10);
    });

});
