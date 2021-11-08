import dotenv from 'dotenv';
import { initScript } from './database-init'
import { Pool } from 'pg'

dotenv.config();

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`
const defaultTime = "00:00:00";

class DatabasePool {
    pool: Pool;
    constructor() {
        this.pool = new Pool({
            connectionString: connectionString,
            ssl: false,
        })
        this.init();

    }


    //check if database is ready
    init = async () => {
        console.log("initializing the database")
        let retries = 0;
        while (retries < 10) {
            try {
                //create tables if don't exist
                let result = await this.pool.query(`SELECT * FROM information_schema.tables WHERE table_schema = current_schema() AND table_name  = 'users'`);
                if (result.rowCount == 0) {
                    console.log("Database is empty, creating initial script")
                    await this.pool.query(initScript);
                }
                console.log("database started successfully")
                break;
            } catch (e) {
                console.log(e)
                retries++;
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
        }

    }

    async query(params: string) {
        return this.pool.query(params)
    }

    registerUser = async (user: any) => {
        let result = await this.pool.query(`SELECT email FROM users WHERE userId = '${user.sub}' AND email ='${user.email}'`)
        if (result.rowCount == 0) {
            console.log(`user ${user.sub} doesn't exist, adding new record to the database`)
            this.pool.query(`INSERT INTO users (userId, email) VALUES ('${user.sub}','${user.email}')`).catch((err) => {
                console.log("unable to add new user")
            });
            return 0;
        } else {
            console.log(`user ${user.sub} is already registered on the database`)
            let ownerQuery = user[`${process.env.AUTH0_URL}/role` || ""] != "Admin" ? `AND ownerId = '${user.sub}'` : "";
            let records = await this.pool.query(`SELECT users.userId  FROM whitelistedVehicles, users WHERE whitelistedVehicles.ownerId = users.userId ${ownerQuery} ORDER BY whitelistedVehicles.vehicleId DESC`);
            return records.rowCount
        }
    }

    getUser = async (userId: number) => {
        let result = await this.pool.query(`SELECT userId as "userId", email FROM users WHERE userId = ${userId}`);
        return result.rows[0] || null;
    }

    getUserList = async () => {
        let result = await this.pool.query(`SELECT userId as "userId", email FROM users`);
        return result.rows;
    }


    getVehicleList = async (context: any) => {
        let ownerQuery = context[`${process.env.AUTH0_URL}/role` || ""] != "Admin" ? `AND ownerId = '${context.sub}'` : "";
        let result = await this.pool.query(`SELECT vehicleId as "vehicleId", licensePlateNumber as "licensePlateNumber", startTime as "startTime", endTime as "endTime", whitelistedVehicles.dateAdded as "dateAdded", users.email as "owner" FROM whitelistedVehicles, users WHERE whitelistedVehicles.ownerId = users.userId ${ownerQuery} ORDER BY whitelistedVehicles.vehicleId DESC`);
        return result.rows
    }

    addWhiteListEntry = async (licensePlateNumber: string, startTime: string | undefined, endTime: string | undefined, context: any) => {
        let _startTime = startTime == undefined ? defaultTime : this.resolveTimeFormat(startTime);
        let _endTime = endTime == undefined ? defaultTime : this.resolveTimeFormat(endTime);
        let insertQuery = `INSERT INTO whitelistedVehicles (ownerId, licensePlateNumber, startTime, endTime) VALUES ('${context.sub}','${licensePlateNumber}','${_startTime}','${_endTime}')`
        await this.pool.query(insertQuery);
        return await this.getVehicleList(context);
    }

    editWhiteListEntry = async (vehicleId: number, licensePlateNumber: string, startTime: string | undefined, endTime: string | undefined, context: any) => {
        let _startTime = startTime == undefined ? defaultTime : this.resolveTimeFormat(startTime);
        let _endTime = endTime == undefined ? defaultTime : this.resolveTimeFormat(endTime);
        await this.pool.query(`UPDATE whitelistedVehicles SET licensePlateNumber = '${licensePlateNumber}', startTime = '${_startTime}', endTime = '${_endTime}' WHERE vehicleId = '${vehicleId}'`)
        return await this.getVehicleList(context);
    }

    deleteWhiteListEntry = async (vehicleId: number, context: any) => {
        if (context[`${process.env.AUTH0_URL}/role` || ""] == "Admin") {
            let result = await this.pool.query(`DELETE FROM whitelistedVehicles WHERE vehicleId = '${vehicleId}'`);
        } else {
            let result = await this.pool.query(`DELETE FROM whitelistedVehicles WHERE ownerId = '${context.sub}' AND vehicleId = '${vehicleId}'`);
        }
        return await this.getVehicleList(context);
    }


    resolveTimeFormat = (time: string) => {
        var time_arr = time.split(":");
        if (time_arr.length == 1 || time_arr.length > 3) {
            return defaultTime;
        } else {
            if (isNaN(Number(time_arr[0])) || isNaN(Number(time_arr[1]))) {
                return defaultTime;
            }
            if (Number(time_arr[0]) <= 24 && Number(time_arr[1]) <= 60) {
                return time_arr.length == 3 ? time : `${time}:00`;
            }
        }
        return defaultTime;

    }
}

export const databasePool = new DatabasePool();
