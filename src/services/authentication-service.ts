
import { inject, injectable } from "inversify";
import { User } from "../types/custom";
import { IAuthenticationService } from "./interfaces/authentication-service.interface";
import { IAuthenticationRepository } from "../repositories/interfaces/authentication-repository.interface";
import { CobDataResolverService } from "./cob-data-resolver-service";
import { Symbols } from "../utils/types";
import { Login } from "../models/Login";
import { CobPerson } from "../models/cob-person.model";
import { profile } from "../utils/app.config";

@injectable()
export class AuthenticationService implements IAuthenticationService {

    private uriRoot: string = (profile === 'local') ? 'http://internal-dsc-d-alb-xx-lb-1442700066.us-east-1.elb.amazonaws.com:8080/' : '';

    constructor(@inject(Symbols.IAuthenticationRepository)  private repository: IAuthenticationRepository) {
    }

    async authenticateUser(username: string, password: string): Promise<User> {
        // Test user credentials
        let login: Login ;
        try {
          login = await this.repository.authenticate( username, password);
        } catch (err: any) {
          return Promise.reject(err);
        }

        // look up user Id by
        try {
          let resolver = new CobDataResolverService<CobPerson>();
          let person: CobPerson = await resolver.postData( this.uriRoot + 'api/v1/users/login',
             { appName: "edi", fieldName: "", fieldValue: login.name });
          let user: User = {
            personId: person.personId,
            firstName: person.name?.first || '',
            middleName: person.name?.middle || '',
            lastName: person.name?.last || '',
            userName: login.name,
            email: person.email,
            loginTimeStamp: login.lastLogonTimestamp > 0 ? new Date(login.lastLogonTimestamp) : null,
            badPwdCount: login.badPwdCount,
            badPasswordTime: login.badPasswordTime,
            lockoutTime: login.lockoutTime,
            pwdLastSet: login.pwdLastSet,
            memberOf: login.memberOf
          };
          console.log('user logged in: ' +  JSON.stringify(user));
          return Promise.resolve(user);
        } catch (err: any) {
          return Promise.reject(err);
        }

    }


    public between(min: number, max: number) : number {  
        return Math.floor(
          Math.random() * (max - min) + min
        )
      }

}