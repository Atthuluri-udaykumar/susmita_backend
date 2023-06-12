export type User = {
    personId: number;
    firstName: string;
    middleName: string;
    lastName: string;
    userName: string;
    email: string | null;
    loginTimeStamp: Date | null;
    badPwdCount: number;
    badPasswordTime: number;
    lockoutTime: number;
    pwdLastSet: number;
    memberOf: []|undefined;
}
