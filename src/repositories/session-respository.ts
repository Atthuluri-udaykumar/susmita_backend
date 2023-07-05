import { injectable } from 'inversify';
import { ServiceResponse } from '../models/serviceresponse.model';
import { http } from '../utils/http';
import { ISessionRepository } from './interfaces/session-repository.interface';
import { EdiSession } from '../models/edi-session.model';
import { TranslatorService } from '../services/translator-service';


@injectable()
export class SessionRepository implements ISessionRepository {

    public SESSIONS_URI = 'sessions';
    /**
     * get session information from sessions service
     */
    public async getSession(loginId: string, applicationName: string): Promise<EdiSession> {
        try {
            //sessions/application/username
            const uri = `${this.SESSIONS_URI}/${applicationName}/${loginId}`;
            let resp = await http.get<ServiceResponse>(uri);
            let result = TranslatorService.translateToEdiSession(resp.data.result);
            return Promise.resolve( result);

        } catch ( error: any ) {
            error.message ??= "Unknown error message";
            return Promise.reject(error);
        }
    
    }

    public async updateSession(loginId: string, applicationName: string, session: EdiSession): Promise<void> {
        try {
            console.log(session);
            const msg = { 
                loginId: loginId, 
                applicationName: applicationName, 
                sessionId: session.refreshToken, 
                roleId: session.role, 
                TTL: 0};
            await http.post(this.SESSIONS_URI, msg);
            return Promise.resolve();
        } catch ( error: any ) {
            error.message ??= "Unknown error message";
            return Promise.reject(error);
        }
                
    }


}
