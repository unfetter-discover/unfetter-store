import * as axios from 'axios';

export function refreshToken(token) {
    const config = {
        headers: {
            authorization: token
        }
    };
    return axios.get('/api/auth/refreshtoken', config);
}
