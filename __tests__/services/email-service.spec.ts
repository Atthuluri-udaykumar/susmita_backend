import { describe, expect, test, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import 'reflect-metadata';
import { http } from '../../src/utils/http';
import { Submitter } from '../../src/models/submitter.model';
import { EmailService } from '../../src/services/email.service';
import {profile, contextPath, jwtKey, rootDir, serverPort, version } from '../../src/utils/app.config';
import * as config from '../../src/utils/app.config';
import { email } from '../../src/utils/email';
import { PersonDetails } from '../../src/models/account-info.model';
import { AppType } from '../../src/models/apptypes.model';

const mockConfig = config as { profile: string };

jest.mock('../../src/utils/app.config', () => ({
    __esModule: true,
    profile: 'local',
    contextPath: '',
    jwtKey: 'SOME_DEFAULT',
    rootDir: '/',
    serverPort: 8080,
    version: '1.0'
  }));

describe('Test Email Service', () => {
    const emailPostSpy = jest.spyOn(email, 'post');

    const testDetail =  {
        jobTitle: "Account Representative (AR)",
        email: "WCS_DEV_AR@test-team.cobqa.com",
        phone: "4102442554",
        phoneExt: "",
        fax: "",
        ssn: "000000000",
        firstName: "First",
        middleName: "",
        lastName: "Last"
    };

    const testMessage =  {
        Category: "EDI",
        Key: "W001",
        To: '',
        Cc: '',
        First: '',
        Last: '',
        Pin: ''
    };
    beforeAll(() => {
        jest.resetModules();
    
        emailPostSpy.mockImplementation(async (url, body) => {
            const message = body as {Category: string, Key: string, To: string, Cc: string, First: string, Last: string, Pin: string };
            if (message.First == 'First') {
               return Promise.resolve({
                status: 200
               });
            } else {
                return Promise.reject( {
                    status: 500
                })
            }
        }); 

    });

    afterAll(() => {
        emailPostSpy.mockRestore();
    });

    beforeEach(() => {

    });

    test('Test sanitize email address', () => {
        mockConfig.profile = 'dev';
        let result = EmailService.sanitizeEmailAddress('foo.bar');
        expect( result).toBe( "foo.bar")

    });

    test('Test sanitize email @test', () => {

        mockConfig.profile = 'dev';
        let result = EmailService.sanitizeEmailAddress('foo.bar' + EmailService.NONPROD_DOMAIN);
        expect( result).toBe( EmailService.NONPROD_EMAIL_ADDRESS);

    });

    test('Test sanitize email @test in PROD', () => {

        mockConfig.profile = 'pro';
        let result = EmailService.sanitizeEmailAddress('foo.bar' + EmailService.NONPROD_DOMAIN);
        expect( result).toBe('foo.bar' + EmailService.NONPROD_DOMAIN);

    });

    test('Test sendEmail', async () => {
        await expect(EmailService.sendResetPinEmail(testDetail, "TEST", AppType.WCS)).resolves.toEqual ( { status: 200 });
    });

    test('Test sendEmail failure', async () => {
        let result: Promise<any>;
        testDetail.firstName = "chuck"
        await expect(EmailService.sendResetPinEmail(testDetail, "TEST", AppType.GHPRP)).rejects.toEqual( {status: 500});

    });

    test('Test sendEmail failure MRP', async () => {
        let result: Promise<any>;
        testDetail.firstName = "chuck"
        await expect(EmailService.sendResetPinEmail(testDetail, "TEST", AppType.MRP)).rejects.toEqual( {status: 500});

    });
});

