import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Room } from "../models/Room.model.js";
import { User } from "../models/User.model.js";
import { UploadOnCloud } from "../utils/CloudinaryUpload.js";
import { DeleteFromCloud } from "../utils/CloudinaryUpload.js";

const createRoomListing = AsyncHandler(async (req, res) => {
    let { rentPerMonth, category, customerGender } = req.body;

    let otherServices = req.body.otherServices;
    let location = req.body.location;
    let address = req.body.address;

    const user = await User.findById(req.user?._id);
    if (!user)
        throw new ApiError(400, "Unable to fetch user");

    if (user.userType != "room-owner" && user.userType != "service-provider")
        throw new ApiError(400, "Select user type as room-owner or service-provider");

    if (typeof otherServices === 'string') {
        try {
            otherServices = JSON.parse(otherServices);
        } catch {
            otherServices = [];
        }
    }

    if (typeof location === 'string') {
        try {
            location = JSON.parse(location);
        } catch {
            throw new ApiError(400, "Invalid location format");
        }
    }

    if (typeof address === 'string') {
        try {
            address = JSON.parse(address);
        } catch {
            throw new ApiError(400, "Invalid address format");
        }
    }

    if (rentPerMonth === undefined ||
        !category ||
        !customerGender ||
        !location?.coordinates ||
        !address?.city ||
        !address?.state || !address?.pincode)
        throw new ApiError(400, "Certain fields are required");

    const uploadedPhotos = [];
    const photoFiles = req.files?.photos || [];

    for (const file of photoFiles) {
        const result = await UploadOnCloud(file.path);
        if (result?.public_id) {
            uploadedPhotos.push({ url: result.secure_url || result.url, publicId: result.public_id });
        }
    }

    const createdroom = await Room.create({
        owner: user._id,
        rentPerMonth,
        category,
        otherServices: otherServices || [],
        customerGender,
        location,
        address,
        photos: uploadedPhotos
    })

    if (!createdroom)
        throw new ApiError(500, "Error occured, room listing is not created");

    return res.status(201)
        .json(new ApiResponse(201, createdroom, "Room listing is done successfullly"));
})

const deleteRoomListing = AsyncHandler(async (req, res) => {
    const roomId = req.params.id;

    if (!roomId)
        throw new ApiError(400, "Room id is not fetched")

    const room = await Room.findById(roomId)
    if (!room)
        throw new ApiError(404, "Room not found");

    if (req.user?._id.toString() !== room.owner.toString())
        throw new ApiError(403, "Only room owner can delete the room listing")

    for (const photo of room.photos) {
        const idToDelete = (photo && typeof photo === 'object') ? photo.publicId || photo.url : photo;
        if (idToDelete) await DeleteFromCloud(idToDelete);
    }

    const deletedRoom = await Room.deleteOne({ _id: roomId })
    if (!deletedRoom)
        throw new ApiError(500, "Error occurred in deleting the room");

    return res.status(200)
        .json(new ApiResponse(200, {}, "Successfully deleted the room listing"))
})


const updateRoomDetails = AsyncHandler(async (req, res) => {

    const userId = req.user?._id;
    const roomId = req.params.id;

    if (!roomId)
        throw new ApiError(400, "RoomId is not found");

    const room = await Room.findById(roomId);
    if (!room)
        throw new ApiError(404, "Room not found")

    if (userId.toString() != room.owner.toString())
        throw new ApiError(403, "Only owner can update details of room listing");

    if (typeof req.body.address === 'string') {
        try {
            req.body.address = JSON.parse(req.body.address);
        } catch (error) {
            throw new ApiError(400, "Invalid address format.");
        }
    }

    if (typeof req.body.location === 'string') {
        try {
            req.body.location = JSON.parse(req.body.location);
        } catch (error) {
            throw new ApiError(400, "Invalid location format.");
        }
    }

    const allowedFields = [
        "rentPerMonth",
        "category",
        "isAvailable",
        "customerGender",
        "location",
        "address",
    ];

    const deletePhotos = req.body.deletePhotos || []
    const addPhotos = req.files?.photos || [];

    const updates = {};
    for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
    }

    let otherServicesAdd = req.body.otherServicesAdd;
    if (otherServicesAdd) {
        if (typeof otherServicesAdd === "string") {
            try {
                otherServicesAdd = JSON.parse(otherServicesAdd);
            } catch {
                otherServicesAdd = [];
            }
        }
        if (Array.isArray(otherServicesAdd) && otherServicesAdd.length > 0) {
            room.otherServices.push(...otherServicesAdd);
        }
    }

    let otherServicesRemove = req.body.otherServicesRemove;

    if (otherServicesRemove) {
        if (typeof otherServicesRemove === "string") {
            try {
                otherServicesRemove = JSON.parse(otherServicesRemove);
            } catch {
                otherServicesRemove = [];
            }
        }

        if (Array.isArray(otherServicesRemove) && otherServicesRemove.length > 0) {
            room.otherServices = room.otherServices.filter(
                (service) => !otherServicesRemove.includes(service)
            );
        }
    }

    room.otherServices = [...new Set(room.otherServices.map(s => s.trim()).filter(Boolean))];

    if (Array.isArray(deletePhotos) && deletePhotos.length > 0) {
        for (const photoId of deletePhotos) {
            const existingIndex = room.photos.findIndex((p) => {
                if (!p) return false;
                if (typeof p === 'string') return p === photoId || p.endsWith(`/${photoId}`);
                return p.publicId === photoId || p.url === photoId || p.url?.endsWith(`/${photoId}`);
            });
            if (existingIndex > -1) {
                const photoObj = room.photos[existingIndex];
                const idToDelete = (typeof photoObj === 'string') ? photoObj : (photoObj.publicId || photoObj.url);
                if (idToDelete) await DeleteFromCloud(idToDelete);
                room.photos.splice(existingIndex, 1);
            }
        }
    }

    if (Array.isArray(addPhotos) && addPhotos.length > 0) {
        for (const photo of addPhotos) {
            const result = await UploadOnCloud(photo.path);
            if (result?.public_id) {
                room.photos.push({ url: result.secure_url || result.url, publicId: result.public_id });
            }
        }
    }

    Object.assign(room, updates);
    const updatedRoom = await room.save();

    return res.status(200)
        .json(new ApiResponse(200, updatedRoom, "Successfully Updated"))
})

const roomsOwnedByOwner = AsyncHandler(async (req, res) => {

    const userId = req.user._id;
    const rooms = await Room.find({ owner: userId }).sort({ createdAt: -1 });

    if (rooms.length === 0)
        throw new ApiError(400, "No rooms found");

    return res.status(200)
        .json(new ApiResponse(200, rooms, "Successfully rooms fetched"));
})

const getAllRooms = AsyncHandler(async (req, res) => {
    const { category, city, state, gender, page = 1, limit = 10, lat, lng, radius } = req.query;
    const filters = {};

    if (category) filters.category = category;
    if (gender) filters.customerGender = gender;
    if (city) filters["address.city"] = city;
    if (state) filters["address.state"] = state;

    if (lat && lng && radius) {
        filters.location = {
            $near: {
                $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                $maxDistance: parseFloat(radius)
            }
        };
    }

    const rooms = await Room.find(filters)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

    const total = await Room.countDocuments(filters);

    return res.status(200).json(
        new ApiResponse(200, { rooms, total }, "Fetched rooms with filters")
    );
});

export {
    createRoomListing, deleteRoomListing,
    updateRoomDetails, getAllRooms, roomsOwnedByOwner
}