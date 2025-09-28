import { Router } from "express";
import {
    createTiffinService, deleteTiffinService,
    getAllTiffins, updateTiffinService
} from "../controllers/tiffin.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Upload } from "../middleware/multer.middleware.js";

const TiffinRouter = Router();

TiffinRouter.route("/create").post(verifyJWT,
    Upload.fields([
        { name: "photos", maxCount: 7 }])
    , createTiffinService);

TiffinRouter.route("/update/:id").patch(verifyJWT,
    Upload.fields([
        { name: "photos", maxCount: 7 }]),
    updateTiffinService);

TiffinRouter.route("/delete/:id").delete(verifyJWT, deleteTiffinService);
TiffinRouter.route("/allTiffins").get(getAllTiffins);

export default TiffinRouter;