import Router from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    createHouseService, deleteHouseService,
    getAllHouseServices, updateHouseService, myServices
} from "../controllers/houseService.controller.js";

const ServiceRouter = Router();

ServiceRouter.route("/create").post(verifyJWT, createHouseService);
ServiceRouter.route("/delete/:id").delete(verifyJWT, deleteHouseService);
ServiceRouter.route("/update/:id").patch(verifyJWT, updateHouseService);
ServiceRouter.route("/allServices").get(getAllHouseServices);
ServiceRouter.route("/myServices").get(verifyJWT, myServices);

export default ServiceRouter