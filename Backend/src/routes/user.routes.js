import { Router } from "express";
import {
    accessRefreshToken, deleteUser,
    getUserDetails, loginUser,
    logoutUser, registerUser,
    resendOtp,
    updateDetails,
    updatePassword,
    verifyOtp
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Upload } from "../middleware/multer.middleware.js";

const UserRouter = Router();

UserRouter.route("/register").post(Upload.fields([{
    name: "Profile_Photo",
    maxCount: 1
}]), registerUser);
UserRouter.route("/login").post(loginUser);
UserRouter.route("/refresh-token").post(accessRefreshToken);
UserRouter.route("/logout").post(verifyJWT, logoutUser);
UserRouter.route("/change-password").patch(verifyJWT, updatePassword);
UserRouter.route("/update").patch(verifyJWT, Upload.fields([{
    name: "Profile_Photo",
    maxCount: 1
}]), updateDetails);
UserRouter.route("/delete").delete(verifyJWT, deleteUser);
UserRouter.route("/details").get(verifyJWT, getUserDetails);
UserRouter.route("/verify").post(verifyOtp);
UserRouter.route("/resendOtp").post(resendOtp);

export default UserRouter;