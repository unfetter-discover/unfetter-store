declare module NodeJS {
    interface Global {
        conn: any,
        unfetterconfigurations: any,
        unfetteropenid: string,
        unfettersocket: any
    }
}
