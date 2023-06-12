import { describe, expect, test, beforeEach } from '@jest/globals';
import {AppType} from '../../src/models/apptypes.model';


describe('Test appType model ', () => {


    beforeEach(() => {
        // serviceMock = new CobAcntActvtyServiceMock();
    });

    test('compares wcs', () => {
        const appType = AppType.WCS;
        expect(appType).toBe(AppType.WCS);
    });

    test('valueof GHPRP', () => {
        const appType = AppType.valueOf('GHPRP');
        expect(appType).toBe(AppType.GHPRP );
    });

    test('valueof MRP', () => {
        const appType = AppType.valueOf('MRP');
        expect(appType).toBe(AppType.MRP);
    });


    test('valueof WCS', () => {
        const appType = AppType.valueOf('WCS');
        expect(appType).toBe(AppType.WCS );
    });

    test('valueof wcs', () => {
        const appType = AppType.valueOf('wcs');
        expect(appType).toBe(AppType.WCS);
    });

    test('valueof nil', () => {
        const appType = AppType.valueOf('nil');
        expect(appType).toBeNull();
    });

    test('valueof unknown', () => {
        const appType = AppType.valueOf('unknown');
        expect(appType).toBeNull();
    });

    test('valueof {}', () => {
        const appType = AppType.valueOf({});
        expect(appType).toBeNull();
    });

    test('valueof 0', () => {
        const appType = AppType.valueOf(0);
        expect(appType).toBeNull();
    });

});
