import mysql from 'mysql';

let singleton = null;
export class DBConnection {
    con: any;

    constructor(Config?: any) {
        if (singleton) {
            return singleton;
        }

        this.con = mysql.createConnection({
            host: Config.database.host,
            user: Config.database.user,
            password: Config.database.password,
            database: Config.database.database,
        });

        this.con.connect(err => {
            if (err) throw err;
            console.log('Connected!');
        });
        singleton = this;
    }
}
