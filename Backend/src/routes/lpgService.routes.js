import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createLpg, deleteLpg, getMyServices } from "../controllers/lpgService.controller.js";

const LpgRouter = Router();

LpgRouter.route("/create").post(verifyJWT, createLpg);
LpgRouter.route("/delete/:id").delete(verifyJWT, deleteLpg);
LpgRouter.route("/myServices").get(verifyJWT, getMyServices);

export default LpgRouter;