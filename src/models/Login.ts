export class Login {
    public dn: string = "";
    public cn: string = "";
    public name: string = "";
    public badPwdCount: number = 0;
    public badPasswordTime: number = 0;
    public lockoutTime: number = 0;
    public lastLogonTimestamp: number = 0;
    public pwdLastSet: number = 0;
    public memberOf: [] = [];

}