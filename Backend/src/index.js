import dotenv from "dotenv";
import { app } from './app.js';
import ConnectDB from "./db/db.js";

dotenv.config({
    path: "../.env",
});

ConnectDB()
    .then(() => {
        app.listen(process.env.PORT || 4000, () => {
            console.log(`Server is started at port : ${process.env.PORT || 4000}`);
        });
    })
    .catch((error) => {
        console.log(`ConnectDB function failed `, error);
    });