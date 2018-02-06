// ~~~ Vendor ~~~
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist';

// ~~~ Init SCSS ~~~
import '../scss/main.scss';

const mainEl = 'main';

(() => {
    window.onload = function () {

        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('token')) {

            const token = urlParams.get('token');

            const ui = SwaggerUIBundle({
                url: "/dist/assets/swagger.json",
                dom_id: `#${mainEl}`,
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                requestInterceptor: function () {
                    console.log('In interceptor');
                }
            });
            window.ui = ui;
            
        } else {
            // No token present
            const el = document.getElementById(mainEl);
            el.innerHTML = `
                <div class="uf-container">
                    <br><br>
                    <div class="uf-error-card">
                        <h4>Error: You Must Enter Through Unfetter</h4>
                        <p class="uf-well-warn">To enter this documentation site, you must authenticate to the Unfetter user interface and use the <strong>API Documentation</strong> in the application menu.</p>
                    </div>
                </div>
            `;
        }
    }
})();
