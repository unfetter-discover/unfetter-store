import { createTransport } from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SmtpOptions } from 'nodemailer-smtp-transport';

const emailConfigJson: SmtpOptions | any = JSON.parse(readFileSync(join(__dirname, '../../../config/private-config.email.json'), 'utf8'));

export function sendMailAlert(emailAddresses: string[], emailSubject: string, bodyHtml: string) {
    const transportConfig: SmtpOptions = emailConfigJson;
    
    emailAddresses.forEach((emailAddress) => {
        const transporter = createTransport(transportConfig);
        transporter.sendMail({
            from: transportConfig.auth.user,
            to: emailAddress,
            subject: emailSubject,
            html: bodyHtml
        }, (err, res) => {
            if (err) {
                console.log(`Unable to send email ${emailSubject} to ${emailAddress}`);
            } else {
                console.log(`Successfully sent email alert to ${emailAddress}`);
            }
            transporter.close();
        });
    });
}
