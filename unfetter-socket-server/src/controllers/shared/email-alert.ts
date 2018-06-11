import { createTransport } from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SmtpOptions } from 'nodemailer-smtp-transport';

let SEND_EMAIL_ALERTS = process.env.SEND_EMAIL_ALERTS || false;
let SERVICE_EMAIL: string = process.env.SERVICE_EMAIL || null;
const HTTPS_PROXY_URL = process.env.HTTPS_PROXY_URL || null;

const emailConfigFile = join(__dirname, '../../../config/private/private-config.email.json');

let emailConfigJson: SmtpOptions | any;
if (SEND_EMAIL_ALERTS === true) {
    try {
        emailConfigJson = JSON.parse(readFileSync(emailConfigFile, 'utf8'));

        if (HTTPS_PROXY_URL) {
            console.log('Adding `proxy` to email configurations');
            emailConfigJson = { ...emailConfigJson, proxy: HTTPS_PROXY_URL };
        }

        if (!SERVICE_EMAIL && emailConfigJson.auth && emailConfigJson.auth.user) {
            SERVICE_EMAIL = emailConfigJson.auth.user;
        }

        if (!SERVICE_EMAIL) {
            console.log('Can not find SERVICE_EMAIL.  Please enter a service email account into the SERVICE_EMAIL environmental variable *OR* the private-config.email.json file.');
            SEND_EMAIL_ALERTS = false;
        }
    } catch (error) {
        console.log(`Unable to find or read ${emailConfigFile}.  Please create an email configuration or set the SEND_EMAIL_ALERTS environmental variable to false.`);
        SEND_EMAIL_ALERTS = false;
    }
}

export const sendMailAlert = SEND_EMAIL_ALERTS ? (emailAddresses: string[], emailSubject: string, bodyHtml: string) => {
    const transportConfig: SmtpOptions = emailConfigJson;
    emailAddresses.forEach((emailAddress) => {
        // TODO determine if a 'smtp' argument is needed when using smtp
        const transporter = createTransport(transportConfig);

        if (transporter) {
            transporter.sendMail({
                from: SERVICE_EMAIL,
                to: emailAddress,
                subject: emailSubject,
                html: bodyHtml
            }, (err, res) => {
                if (err) {
                    console.log(`Unable to send email ${emailSubject} to ${emailAddress}`);
                    console.log(err);
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
    console.log('WARNING: an errorenous attempt to send an email alert has been made.  This is likely due to a misplaced SEND_EMAIL_ALERTS variable or improper email configuration');
};
