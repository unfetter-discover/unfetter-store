# Unfetter Email Alerting
Unfetter will send admins and users email alerts upon certain actions.
#### Enable Email Alerts
Email alerting is **off** by default.  To enable email alerting, set the `SEND_EMAIL_ALERTS` environmental variable to `true`.  The server must be restarted if it applied to a running server.
#### Email Configuration
Email alerting **requires** manual configuration.  Unfetter uses [nodemailer](https://nodemailer.com) to send emails, and the git-ignored file `private-config.email.json` is where the server's email configurations used by nodemailer are to be stored.

Nodemailer offers a wide range of options.  Unfetter provides templates for various services to assist users in configuring nodemailer.  These template are located in the `unfetter-store/unfetter-socket-server/config` directory.
#### Proxy Support
Nodemailer has built in proxy support.  Add a `proxy` property with the proxy's url to the configuration file.  For more information, see [proxy support](https://nodemailer.com/smtp/proxies/)