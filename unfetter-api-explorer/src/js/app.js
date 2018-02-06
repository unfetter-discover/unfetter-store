// ~~~ Vendor ~~~
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist';

// ~~~ Init SCSS ~~~
import '../scss/main.scss';

console.log('HI!!!!');

(() => {
    window.onload = function () {
        // Build a system
        const ui = SwaggerUIBundle({
            // url: "http://petstore.swagger.io/v2/swagger.json",
            url: "/dist/assets/swagger.json",
            dom_id: '#swagger-ui',
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
    }
})();
