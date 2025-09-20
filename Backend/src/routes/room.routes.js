import { Router } from "express"
import {
    createRoomListing, deleteRoomListing,
    getAllRooms, roomsOwnedByOwner,
    updateRoomDetails
} from "../controllers/room.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Upload } from "../middleware/multer.middleware.js";

const RoomRouter = Router();

RoomRouter.route("/create").post(verifyJWT,
    Upload.fields([
        { name: "photos", maxCount: 7 }])
    , createRoomListing);

RoomRouter.route("/update/:id").patch(verifyJWT,
    Upload.fields([
        { name: "photos", maxCount: 7 },
    ]), updateRoomDetails)

RoomRouter.route("/delete/:id").delete(verifyJWT, deleteRoomListing)
RoomRouter.route("/allRooms").get(getAllRooms)
RoomRouter.route("/myRooms").get(verifyJWT, roomsOwnedByOwner)

export default RoomRouter;