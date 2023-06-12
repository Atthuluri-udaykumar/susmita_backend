import { TaskResponse } from "../models/task/task-response.model";

export class DataFormatUtils {
  static ZIP54_PATTERN                 = /^[0-9]{5}?(-{1})?(\d{4})?\s{0,4}?(_{0,4})?$/;
  static PHONE_EXTN_PATTERN            = /^\(\d{3}\)\s\d{3}-\d{4}?\s?(x{1}\d{0,5})?\s{0,5}?(_{0,5})?$/;
  static FAX_PATTERN                   = /^\(\d{3}\)\s\d{3}-\d{4}$/;
  static UNDRSCORE_DASH_SPACE_PATTERN  = /(_| |-)/g;
  
  static parsePhoneExtn(phoneExtnVal: string): any{
    const parsedPhoneExtn = { phone: '', extn: ''};

    if(phoneExtnVal){
      if( phoneExtnVal.length > 10){
        let extnLoc:number = phoneExtnVal.indexOf("x");
        if( extnLoc > -1){
          parsedPhoneExtn.extn = phoneExtnVal.substring(extnLoc+1);
          parsedPhoneExtn.phone = phoneExtnVal.substring(0, extnLoc-1);
        }  else {
          parsedPhoneExtn.extn = phoneExtnVal.substring(10);
          parsedPhoneExtn.phone = phoneExtnVal.substring(0, 10);
        }
      } else {
        parsedPhoneExtn.extn = "";
        parsedPhoneExtn.phone = phoneExtnVal.substring(0, 10);
      }
      parsedPhoneExtn.phone = parsedPhoneExtn.phone.replace(DataFormatUtils.UNDRSCORE_DASH_SPACE_PATTERN,"")
                             .replace("(","")
                             .replace(")","");
      parsedPhoneExtn.extn = parsedPhoneExtn.extn.replace(DataFormatUtils.UNDRSCORE_DASH_SPACE_PATTERN,"");
    }

    return parsedPhoneExtn;
  }

  static parseZip5_4(zipVal: string): any{
    const zip54 = { zip5: '', zip4: ''};

    if(zipVal){
      if( zipVal.length > 5){
        let extnLoc:number = zipVal.indexOf("-");
        if( extnLoc > -1){
          zip54.zip4 = zipVal.substring(extnLoc+1);
          zip54.zip5 = zipVal.substring(0, extnLoc-1);
        }  else {
          zip54.zip4 = zipVal.substring(5);
          zip54.zip5 = zipVal.substring(0, 5);
        }
      } else {
        zip54.zip4 = '';
        zip54.zip5 = zipVal;
      }
    }

    return zip54;
  }
}
