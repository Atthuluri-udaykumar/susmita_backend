
import { inject, injectable } from 'inversify';
import { Symbols } from '../utils/types';
import { ISessionService } from './interfaces/session-service.interface';
import { EdiSession } from '../models/edi-session.model';
import { ISessionRepository } from '../repositories/interfaces/session-repository.interface';
import { getCurrentUser } from '../middleware/current-user';

/**
 * CobAcntActvty Service
 */
@injectable()
export class SessionService implements ISessionService {

    constructor(@inject(Symbols.ISessionRepository)  private repository: ISessionRepository) {
    }

    /**
     * Get the current user session, if one does not exist creates a new blank session
     */
    public async getSession(): Promise<EdiSession>  {
        try {
            let session: EdiSession = await this.repository.getSession(getCurrentUser(), "edi");
            return Promise.resolve(session);
        } catch (error: any) {
            error.message ??= "Unknown error message";
            return Promise.reject(error);
        }
    }

    /**
     * Updates the session information for the current user (in httpContext)
     * @param session 
     */
    public async updateSession(session: EdiSession): Promise<void> {
        try {
           return this.repository.updateSession(getCurrentUser(), "edi", session);
        } catch (error: any) {
            error.message ??= "Unknown error message";
            return Promise.reject(error);
        }
    }

}
