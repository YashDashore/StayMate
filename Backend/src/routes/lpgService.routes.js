import Router from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    createLpgService, deleteLpgService,
    getAllLpgServices, getMyLpgServices, updateLpgCapacity, updateLpgService
} from "../controllers/lpgService.controller.js";

const LpgRouter = Router();

LpgRouter.route("/create").post(verifyJWT, createLpgService);
LpgRouter.route("/delete/:id").delete(verifyJWT, deleteLpgService);
LpgRouter.route("/update/:id").patch(verifyJWT, updateLpgService);
LpgRouter.route("/myServices").get(verifyJWT, getMyLpgServices);
LpgRouter.route("/updateCapacity/:id").patch(verifyJWT, updateLpgCapacity);
LpgRouter.route("/allServices").get(getAllLpgServices);

export default LpgRouter;