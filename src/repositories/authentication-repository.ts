import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import { ServiceResponse } from '../models/serviceresponse.model';
import { http } from '../utils/http';
import { IAuthenticationRepository } from './interfaces/authentication-repository.interface';
import { Login } from '../models/Login';
import { Credentials } from '../models/credentials';


@injectable()
export class AuthenticationRepository implements IAuthenticationRepository {
    public AUTHENTICATION_URI = 'cob-auth/login';

    public async authenticate(username: string, password: string): Promise<Login> {
        let creds = { username: username, password: password };

        try {
            let resp: AxiosResponse<ServiceResponse> =  await http.post<Credentials, ServiceResponse>(this.AUTHENTICATION_URI, creds);
            return Promise.resolve(this.translateToLogin(resp.data.result));
        } catch (err : any) {
            return Promise.reject(err);
        }

    }

    private translateToLogin( result: any ): Login {
        let login = new Login();
        login = Object.assign(login, result);
        return login;
    }
    




}
