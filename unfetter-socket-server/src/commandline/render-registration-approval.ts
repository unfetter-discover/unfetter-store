import { writeFileSync } from 'fs';
import { join } from 'path';

import { renderRegistrationApproval } from '../controllers/shared/render-template';

const outfile = join(__dirname, 'registration-approval-test.html');

const rendered = renderRegistrationApproval();

writeFileSync(outfile, rendered, 'utf8');

console.log(`Template successfully rendered and saved to ${outfile}.`);
