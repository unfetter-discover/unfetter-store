import { createTransport } from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SmtpOptions } from 'nodemailer-smtp-transport';

const SEND_EMAIL_ALERTS = process.env.SEND_EMAIL_ALERTS || false;
const emailConfigFile = join(__dirname, '../../../config/private-config.email.json');

let emailConfigJson: SmtpOptions | any;

if (SEND_EMAIL_ALERTS) {
    try {
        emailConfigJson = JSON.parse(readFileSync(emailConfigFile, 'utf8'));
    } catch (error) {
        console.log(`Unable to find or read ${emailConfigFile}.  Please create an email configuration or set the SEND_EMAIL_ALERTS environmental variable to false.`);
        process.exit(1);
    }
}

export const sendMailAlert = SEND_EMAIL_ALERTS ? (emailAddresses: string[], emailSubject: string, bodyHtml: string) => {
    const transportConfig: SmtpOptions = emailConfigJson;
    emailAddresses.forEach((emailAddress) => {
        // TODO determine if a 'smtp' argument is needed when using smtp
        const transporter = createTransport(transportConfig);

        if (transporter) {
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
        } else {
            console.log(`Unable to create email transporter`);
        }
        
    });
} : (a: any, b: any, c: any) => { 
    console.log('WARNING: an errorenous attempt to send an email alert has been made.  This is likely due to a misplaced SEND_EMAIL_ALERTS variable');
};
