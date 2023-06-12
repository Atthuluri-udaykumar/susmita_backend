
import { injectable } from 'inversify';
import { IAuthenticationService} from '../../src/services/interfaces/authentication-service.interface';
import { User } from '../../src/types/custom';

/**
 * AuthenticationServiceMock Service
 */
@injectable()
export class AuthenticationServiceMock implements IAuthenticationService {
    private testUser: User  ={ memberOf: undefined, badPasswordTime: 0, badPwdCount: 0,email:"", firstName: "mockUser",lastName:"",lockoutTime: 0,loginTimeStamp: null, middleName: "",personId: 0,pwdLastSet: 0, userName:"mockUser" };

    // only  mockuser is valid user name
    async authenticateUser(username: any, password: any): Promise<User> {
        if( username == "mockuser") {
            return Promise.resolve(this.testUser);
        }
        // throw new Error('Method not implemented.');
        return Promise.reject('Unknown user');
    }

}
