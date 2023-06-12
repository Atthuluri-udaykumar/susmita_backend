import { CobAddress } from "./cob-address.model";
import { CobName } from "./cob-name.model";
import { DateOnly } from "./dateonly";

export class CobPerson {

    public personId: number = 0;
    public login: string = ''
    public password: string | null = null;
    public name: CobName| null = null;
    public birthday: DateOnly | null = null;
    public ssn: string | null =  null;
    public email: string | null = null;
    public title: string | null = null;
    public phoneNumber: string | null = null;
    public faxNumber: string | null = null;
    public address: CobAddress | null = null;
        // "securityQuestions": [],
        // "personAttributes": [
        //     {
        //         "id": 1,
        //         "name": "Password is temporary"
        //     }
        // ],
        // "employerRoles": [
        //     {
        //         "personId": 2781,
        //         "employerId": 1947,
        //         "role": {
        //             "code": "03",
        //             "description": "Designee"
        //         },
        //         "pendingReplace": null,
        //         "personalSecutiryId": null,
        //         "emailSecurityToken": null,
        //         "einStatus": null
        //     }
        // ],
        // "validationStatus": {
        //     "code": "01",
        //     "description": "Active"
        // },
    public loginTimeStamp: Date | null = null;
    public failedLoginAttempts: number = 0;
    public lastLoginFailed: Date | null = null;

}