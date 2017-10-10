export class Environment {
    public static apiProtocol = process.env.API_PROTOCOL || 'https';
    public static apiHost = process.env.API_HOST || 'localhost';
    public static apiPort = process.env.API_PORT || '443';
    public static context = process.env.API_CONTEXT || '/api/';
}
