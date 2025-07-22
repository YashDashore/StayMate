import { Router } from "express"
import {
    createRoomListing, deleteRoomListing,
    getAllRooms, roomsOwnedByOwner,
    updateRoomDetails
} from "../controllers/room.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const RoomRouter = Router();

RoomRouter.route("/create").post(verifyJWT, createRoomListing);
RoomRouter.route("/delete/:id").delete(verifyJWT, deleteRoomListing)
RoomRouter.route("/update/:id").patch(verifyJWT, updateRoomDetails)
RoomRouter.route("/allRooms").get(getAllRooms)
RoomRouter.route("/myRooms").get(verifyJWT, roomsOwnedByOwner)

export default RoomRouter;