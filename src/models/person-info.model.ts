import { MirPrsn } from './mir-prsn.model';
import { MirPrsnQstn } from './mir-prsn-qstn.model';
import { MirRrePrsn } from './mir-rre-prsn.model';
import { IdProof } from './id-proof.model';
import { Submitter } from './submitter.model';

export class PersonInfo {
  public person: MirPrsn | undefined;
  public qstnList: MirPrsnQstn[]|[] = [];
  public rreList: MirRrePrsn[]|[] = [];
  public idProof: IdProof | {} = {};//undefined;
  public sbmtrList: Submitter[]|[] = [];

  public displayInfo: {
                        showIdProofDetails: boolean,
                        optionRestartIdProof: boolean,
                        optionIdProofUser: boolean,
                        optionResetPwd: boolean,
                        optionUnlockUserAcct: boolean,
                        optionReactivate: boolean,
                        optionSendToken: boolean,
                      } = {
                        showIdProofDetails: false,
                        optionRestartIdProof: false,
                        optionIdProofUser: false,
                        optionResetPwd: false,
                        optionUnlockUserAcct: false,
                        optionReactivate: false,
                        optionSendToken: false,
                      };
                      
  public actionInfo: {
                        status: number, 
                        errors: any[],
                        actionRestartIdProof: boolean,
                        actionIdProofUser: boolean,
                        actionResetPwd: boolean,
                        actionUnlockUserAcct: boolean,
                        actionReactivate: boolean,
                        actionSendToken: boolean,
                      } = {
                        status: 200,
                        errors: [],
                        actionRestartIdProof: false,
                        actionIdProofUser: false,
                        actionResetPwd: false,
                        actionUnlockUserAcct: false,
                        actionReactivate: false,
                        actionSendToken: false,
                      };
}
