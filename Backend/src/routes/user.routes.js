import { Router } from "express";
import {
    accessRefreshToken, deleteUser,
    getUserDetails, loginUser,
    logoutUser, registerUser,
    updateDetails,
    updatePassword
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const UserRouter = Router();

UserRouter.route("/register").post(registerUser);
UserRouter.route("/login").post(loginUser);
UserRouter.route("/refresh-token").post(accessRefreshToken);
UserRouter.route("/logout").post(verifyJWT, logoutUser);
UserRouter.route("/change-password").patch(verifyJWT, updatePassword);
UserRouter.route("/update").patch(verifyJWT, updateDetails);
UserRouter.route("/delete").delete(verifyJWT, deleteUser);
UserRouter.route("/details").get(verifyJWT, getUserDetails);

export default UserRouter;