import { sendMailAlert } from '../controllers/shared/email-alert';
import * as yargs from 'yargs';

const argv = yargs.alias('h', 'host')
    .alias('e', 'emails')
    .describe('e', 'List of email addresses to send a test email to (1 to n)')
    .array('e')
    .help('help')
    .argv;

const emails = argv.emails

if (emails) {
    sendMailAlert(emails, 'Test Email from Unfetter', '<h1>This is an Unfetter test email.</h1><p>This is for system testing purposes only, please disregard.</p>');
} else {
    console.log('This script requires 1-n emails.  Usage: -e email@domain.com.  See --help for help.');
}
