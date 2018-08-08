/**
 * This is a passport strategy designed to test the ability to create an authentication that does not follow the OAuth2
 * pattern of performing redirects after the authentication is complete.
 */

// const util = require('util');
const Strategy = require('passport-strategy').Strategy;
const AuthHelper = require('../helpers/auth_helpers').AuthHelper;

const DEMO_USER = {
    id: -1,
    username: 'demo-user'
};

class DemoStrategy extends Strategy {

    constructor() {
        super();
        this.name = 'demo';
    }

    authenticate(req, options) {
        this.success(DEMO_USER);
    }

}

class DemoAuth extends AuthHelper {

    constructor() {
        super('demo');
        this.redirects = true;
    }

    build(config, env) {
        const demoStrategy = new DemoStrategy(config, env);
        return demoStrategy;
    }

    options() {
        return {};
    }

    search(user) {
        return { 'auth.id': user.id };
    }

    sync(user, demoInfo, approved) {
        super.sync(user, demoInfo, true);
        user.auth.service = 'demo';
        user.auth.userName = demoInfo.username;
        user.registered = true;
        user.role = 'STANDARD_USER';
    }

}

(() => new DemoAuth())();
