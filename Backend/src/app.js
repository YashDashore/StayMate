import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser'

const app = express();
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
    })
);
app.use(express.json()); //Accepting the json file.
app.use(
    express.urlencoded({
        limit: "20kb",
    })
);

app.use(express.static("public")); // used to store pdfs, public assets
app.use(cookieParser())


import UserRouter from "./routes/user.routes.js";

// http://localhost:4000/pgHelper/v1/user
app.use("/pgHelper/v1/user", UserRouter)

app.get("/", (req, res) => {
    res.send("<h1>Home Page</h1>");
});

export { app };