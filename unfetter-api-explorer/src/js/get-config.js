import * as axios from 'axios';

export function getConfig(token) {
    const config = {
        headers: {
            authorization: token
        }
    };
    const filter = encodeURI(JSON.stringify({ configKey: 'jwtDurationSeconds' }));
    return axios.get(`/api/config?filter=${filter}`, config);
}
