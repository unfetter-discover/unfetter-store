// ~~~ Vendor ~~~
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist';

// ~~~ Init SCSS ~~~
import '../scss/main.scss';
import { refreshToken } from './refresh-token';
import { getConfig } from './get-config';

const urlParams = new URLSearchParams(window.location.search);
const mainEl = 'main';
// Grace period between attempts to refresh JWT token
const refreshBuffer = 0.3;
let token = ''

function showErrorCard(title, body) {
    const el = document.getElementById(mainEl);
    el.innerHTML = `
        <div class="uf-container">
            <br><br>
            <div class="uf-error-card">
                <h4>Error: ${title}</h4>
                <p class="uf-well-warn">${body}</p>
            </div>
        </div>
    `;
}

function initToken() {
    token = urlParams.get('token');
    let tokenRefreshMs = 10000;
    refreshToken(token)
        .then((response) => {
            if (response.data.data && response.data.data.attributes && response.data.data.attributes.token) {
                token = response.data.data.attributes.token;
                getConfig(token)
                    .then((config) => {
                        if (config.data && config.data.data && config.data.data.length && config.data.data[0].attributes && config.data.data[0].attributes.configValue) {
                            tokenRefreshMs = config.data.data[0].attributes.configValue * 1000;
                            tokenRefreshMs = Math.floor(tokenRefreshMs - (refreshBuffer * tokenRefreshMs));
                            setInterval(() => {
                                refreshToken(token)
                                    .then((response) => {
                                        if (response.data.data && response.data.data.attributes && response.data.data.attributes.token) {
                                            console.log('Token refreshed');
                                            token = response.data.data.attributes.token;
                                        } else {
                                            showErrorCard('Unable to Refresh Token', 'Reopen API Explorer from Unfetter.');
                                        }
                                    })
                            }, tokenRefreshMs);
                        }
                    })
                    .catch((err) => {
                        showErrorCard('Unable to Get Configurations', 'This instance of Unfetter is likely misconfigured.  Contact an admin.');
                    });
            } else {
                showErrorCard('Unable to Refresh Token', 'Reopen API Explorer from Unfetter.');
            }
        })
        .catch((err) => {
            showErrorCard('Unable to Refresh Token', 'Reopen API Explorer from Unfetter.');
        });

    
}

(() => {
    window.onload = function () {     
        const RUN_MODE = urlParams.get('RUN_MODE');
        
        if (RUN_MODE && RUN_MODE === 'DEMO') {
            console.log('Starting in DEMO mode');
        } else {
            console.log('Starting in UAC mode');     

            if (urlParams.has('token')) {
                initToken();
            } else {
                showErrorCard('You Must Enter Through Unfetter', 'To enter this documentation site, you must authenticate to the Unfetter user interface and use the <strong>API Explorer</strong> link in the application menu.');
            }
        }

        window['SwaggerUIBundle'] = window['swagger-ui-bundle'];
        window['SwaggerUIStandalonePreset'] = window['swagger-ui-standalone-preset'];

        const ui = SwaggerUIBundle({
            url: '/explorer/assets/swagger.json',
            dom_id: `#${mainEl}`,
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: 'StandaloneLayout',
            requestInterceptor: (req) => {
                req.headers.authorization = token;
                return req;
            }
        });
        window.ui = ui;
    }
})();
