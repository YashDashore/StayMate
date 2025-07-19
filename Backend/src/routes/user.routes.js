import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";

const UserRouter = Router();

UserRouter.route("/register").post(registerUser);
UserRouter.route("/login").post(loginUser);

export default UserRouter;