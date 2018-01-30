export interface Connection {
    user: any;
    token: string;
    client: SocketIO.Socket;
    connected: boolean;
}
