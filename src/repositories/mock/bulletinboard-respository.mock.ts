
import { injectable } from 'inversify';
import { EdiMessage } from '../../models/edi-message.model';
import { IBulletinBoardRepository } from '../../repositories/interfaces/bulletinboard-repository.interface';
import { User } from '../../types/custom';

/**
 * BulletinBoardServiceMock Service
 */
@injectable()
export class BulletinBoardRepositoryMock implements IBulletinBoardRepository {

    private messages: EdiMessage[] = [ {application: 'Section 111', message: 'This is a test message from Section 111'},
    {application: 'WCMSAP', message: 'This is a test message from WCMSAP'},
    {application: 'MSPRP', message: 'This is a test message from MSPRP'},
    {application: 'CRCP', message: 'This is a test message from CRCP'},
    {application: 'ECRS', message: 'This is a test message from ECRS'}];

    async fetchAll(): Promise<EdiMessage[]> {
        return Promise.resolve(this.messages);
    }
    async fetchLatest(): Promise<EdiMessage[]> {
        return Promise.resolve(this.messages);
    }
    async updateMessages(user: User, messages: EdiMessage[]): Promise<void> {
        return Promise.resolve();
    }

    async getLatestMessages(): Promise<EdiMessage[]> {
        return Promise.resolve([]);
    }


}
