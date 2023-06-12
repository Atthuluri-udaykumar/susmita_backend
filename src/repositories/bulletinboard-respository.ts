import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import { EdiMessage } from '../models/edi-message.model';
import { MirEdiCntntTbl } from '../models/miredicntnttbl.model';
import { ServiceResponse } from '../models/serviceresponse.model';
import { TranslatorService } from '../services/translator-service';
import { User } from '../types/custom';
import { http } from '../utils/http';
import { IBulletinBoardRepository } from './interfaces/bulletinboard-repository.interface';


@injectable()
export class BulletinBoardRepository implements IBulletinBoardRepository {
    public BULLETINBOARD_URI = 'announcements/bulletinboards';

    public async updateMessages(user: User, messages: EdiMessage[]): Promise<void> {

        console.log(messages);
        try {
            for(const element of messages) {
                console.log(element);
                const msg: MirEdiCntntTbl = TranslatorService.translateToMirEdiCntntTbl(element);
                msg.ediRepLoginId = user.userName;
                await http.post(this.BULLETINBOARD_URI, msg);
            }
            return Promise.resolve();
        } catch ( error: any ) {
            error.message ??= "Unknown error message";
            return Promise.reject(error);
        }

    }
    

    public async fetchAll() : Promise<EdiMessage[]> {
        let result: EdiMessage[] = [];

        try {
            let resp = await http.get<ServiceResponse>(this.BULLETINBOARD_URI);
            resp.data.result.forEach((element: any) => {
                result.push(TranslatorService.translateToEdiMessage( element)             );
            });
            return Promise.resolve( result);

        } catch (error: any) {
            error.message ??= "Unknown error message";
            return Promise.reject(error);
        }
    }

    public async fetchLatest() : Promise<EdiMessage[]> {
        let result: EdiMessage[] = [];
console.log('calling fetchLatest');
        try {
            let resp: AxiosResponse<ServiceResponse> = await http.get<ServiceResponse>(this.BULLETINBOARD_URI + "?latest=true");
            resp.data.result.forEach((element: any) => {
                result.push(TranslatorService.translateToEdiMessage( element));
            });
            return Promise.resolve( result);

        } catch (error: any) {
            error.message ??= "Unknown error message";
            return Promise.reject(error);
        }
    }
  


}
