import { Request } from 'express';

import { isDefinedJsonApi } from './isdefined';
import { sendMailAlert } from './email-alert';
import { renderUserRegistered, renderRegistrationApproval } from './render-template';

export function routeEmail(req: Request, emailAddresses: string[]): void {
    if (isDefinedJsonApi(req, ['emailData', 'template'], ['emailData', 'subject'], ['emailData', 'body'])) {
        const emailData = req.body.data.attributes.emailData;        
        switch (emailData.template) {
            case 'USER_REGISTERED': {
                const emailHtml = renderUserRegistered(emailData.body);
                sendMailAlert(emailAddresses, emailData.subject, emailHtml);
                break;
            }
            case 'REGISTRATION_APPROVAL': {
                const emailHtml = renderRegistrationApproval(emailData.body);
                sendMailAlert(emailAddresses, emailData.subject, emailHtml);
                break;
            }
            default:
                console.log('WARNING: unable to process email template: ', emailData.template);
        }
    }
}
