import * as jwt from 'jsonwebtoken';
import { CONFIG } from '../models/CONFIG';

export function jwtVerify(token: string): Promise<any> {

    let tokenHash: string;
    if (token.match(/^Bearer\ /) !== null) {
        tokenHash = token.split('Bearer ')[1].trim()
    } else {
        tokenHash = token;
    }
    
    return new Promise((resolve, reject) => {
        jwt.verify(tokenHash, CONFIG.jwtSecret, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
}
