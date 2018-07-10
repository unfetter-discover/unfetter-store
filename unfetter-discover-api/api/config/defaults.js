/**
 * These are developer determined defaults for variables if the user has not passed
 * a value into private-config.json or an environment variable
 *
 * Note: Not every config variable is intended to have a default value
 */

const configDefaults = [
    {
        configKey: 'apiRoot',
        configValue: 'https://localhost/api',
        envKey: 'API_ROOT'
    }
];

module.exports = configDefaults;
