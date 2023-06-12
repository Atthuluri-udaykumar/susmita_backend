import { PersonDetails } from "../models/account-info.model";
import { AppType } from "../models/apptypes.model";
import { email } from "../utils/email";
import { profile } from '../utils/app.config';

export class EmailService {

    public static NONPROD_DOMAIN = '@test-team.cobqa.com';
    public static NONPROD_EMAIL_ADDRESS = 'cob-testing-group@gdit.com';

  public static async sendResetPinEmail(personDetails: PersonDetails, pin: string, appType: AppType): Promise<any> {

    let key : string;
    const category = 'EDI';
    switch(appType) {
        case AppType.WCS:
            key = 'W001';
            break;
        case AppType.MRP:
            key = 'M001';                
            break;
        default:
            key = 'C001';
    }

    const message =  {
        Category: category,
        Key: key,
        To: [EmailService.sanitizeEmailAddress(personDetails.email)],
        First: personDetails.firstName,
        Last: personDetails.lastName,
        Pin: pin
    };


    // POST https://b9fkl7egei.execute-api.us-east-1.amazonaws.com/dev/emails -H 'accept: */*' -H 'x-api-key: MuqlyRpR3o7m1hhJu5E4z4FgetGpEogt3eE3fEFp' 
    // '{"Category":"EDI","Key":"W001","From":"DoNotReply@mail.cob.cms.hhs.gov","To":"[chhabilata.gudu@gdit.com]","First":"Chhabi","Last":"Gudu","Pin":"1234"}'
    try {
        const response =  await email.post<any,any>('', message);
        if( response.status == 200) {
            return Promise.resolve( { status: 200 });
        } else {
            return Promise.reject( { status: 500 })
        }
    
    } catch (err ) {
        return Promise.reject(err);
    }

  }

  	/**
	 * As we have restrictions of using unique email address in application, We had configuration in mail server to redirect email to 
	 * cob-testing-group@gdit.com if user address ends with domain @test-team.cobqa.com.
	 * While moving to AWS environment we can not put rules in mail server as it is external not handled by our INFRA.
	 * So we have introduce below to update email address (to/cc/bcc) ends with @test-team.cobqa.com to "cob-testing-group@gdit.com".
	 * We don't need conversion for production environment.
	 * @param email
	 * @return
	 */
	public static sanitizeEmailAddress( email: string ) : string {
		let address = email;
		if( profile.toLowerCase() == "dev" 
            || profile.toLowerCase() == "imp") {
			if(email.toLowerCase().endsWith(EmailService.NONPROD_DOMAIN)) {
				address = EmailService.NONPROD_EMAIL_ADDRESS;
			}
		}
		return address;
	}

}

