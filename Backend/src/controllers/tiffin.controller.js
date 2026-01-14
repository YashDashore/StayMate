import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tiffin } from "../models/Tiffin.model.js";
import { User } from "../models/User.model.js";
import { UploadOnCloud, DeleteFromCloud } from "../utils/CloudinaryUpload.js";

const createTiffinService = AsyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id);
    if (user.userType != "service-provider")
        throw new ApiError(400, "Change the user type as Service-provider");

    const { name, deliveryAvailable, landline } = req.body;

    let location = req.body.location;
    let address = req.body.address;
    let timings = req.body.timings;
    let price = req.body.price;

    if (typeof location === 'string') {
        try {
            location = JSON.parse(location);
        } catch {
            throw new ApiError(400, "Invalid location format");
        }
    }
    if (typeof price === 'string') {
        try {
            price = JSON.parse(price);
        } catch {
            throw new ApiError(400, "Invalid price format");
        }
    }

    if (typeof timings === 'string') {
        try {
            timings = JSON.parse(timings);
        } catch {
            throw new ApiError(400, "Invalid Timing format");
        }
    }

    if (typeof address === 'string') {
        try {
            address = JSON.parse(address);
        } catch {
            throw new ApiError(400, "Invalid address format");
        }
    }

    if (!name || !price.perPlate ||
        !timings.closingTime || !timings.openingTime ||
        !location?.coordinates ||
        !address?.city || !address?.state || !address?.pincode)
        throw new ApiError(400, "Certain fields are required");

    const uploadPhoto = [];
    const photoList = req.files?.photos || [];

    for (const photo of photoList) {
        const result = await UploadOnCloud(photo.path);
        if (result?.public_id)
            uploadPhoto.push({ url: result.secure_url || result.url, publicId: result.public_id });
    }

    const createdTiffinCenter = await Tiffin.create({
        owner: user._id,
        name,
        location,
        address,
        deliveryAvailable,
        timings,
        price,
        landline,
        photos: uploadPhoto
    })
    if (!createdTiffinCenter)
        throw new ApiError(500, "Server error in creating tiffin listing");
    return res.status(201)
        .json(new ApiResponse(201, createdTiffinCenter, "Tiffin center listing successfully created"));
})

const deleteTiffinService = AsyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id);
    const tiffinId = req.params.id;

    if (!tiffinId)
        throw new ApiError(400, "Failed to fetch tiffin Id");

    const tiffin = await Tiffin.findById(tiffinId);
    if (!tiffin)
        throw new ApiError(404, "Tiffin center not found");

    if (user._id.toString() !== tiffin.owner.toString())
        throw new ApiError(403, "Only owner can delete the tiffin service");

    const deletedTiffin = await Tiffin.findByIdAndDelete(tiffinId);
    if (!deletedTiffin)
        throw new ApiError(500, "Error occurred in deletion");

    return res.status(200)
        .json(new ApiResponse(200, {}, "Successfully deleted the listing"));
})

const updateTiffinService = AsyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);
    const tiffinId = req.params.id;

    if (!tiffinId)
        throw new ApiError(400, "Failed to fetch tiffin Id");

    const tiffin = await Tiffin.findById(tiffinId);
    if (!tiffin)
        throw new ApiError(404, "Tiffin center not found");

    if (user._id.toString() !== tiffin.owner.toString())
        throw new ApiError(403, "Only owner can delete the tiffin service");

    const allowedFields = [
        "name",
        "deliveryAvailable",
        "landline",
        "active",
    ];

    const deletePhotos = req.body.deletePhotos || []
    const addPhotos = req.files?.photos || [];

    const updates = {};
    for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
    }

    if (req.body.address) {
        tiffin.address = {
            ...tiffin.address,
            ...req.body.address
        };
    }

    if (req.body.price) {
        tiffin.price = {
            ...tiffin.price,
            ...req.body.price
        };
    }

    if (req.body.timings) {
        tiffin.timings = {
            ...tiffin.timings,
            ...req.body.timings
        };
    }
    if (Array.isArray(deletePhotos) && deletePhotos.length > 0) {
        for (const photoId of deletePhotos) {
            const existingIndex = tiffin.photos.findIndex((p) => {
                if (!p) return false;
                if (typeof p === 'string') return p === photoId || p.endsWith(`/${photoId}`);
                return p.publicId === photoId || p.url === photoId || p.url?.endsWith(`/${photoId}`);
            });
            if (existingIndex > -1) {
                const photoObj = tiffin.photos[existingIndex];
                const idToDelete = (typeof photoObj === 'string') ? photoObj : (photoObj.publicId || photoObj.url);
                if (idToDelete) await DeleteFromCloud(idToDelete);
                tiffin.photos.splice(existingIndex, 1);
            }
        }
    }

    if (Array.isArray(addPhotos) && addPhotos.length > 0) {
        for (const photo of addPhotos) {
            const result = await UploadOnCloud(photo.path);
            if (result?.public_id) {
                tiffin.photos.push({ url: result.secure_url || result.url, publicId: result.public_id });
            }
        }
    }

    Object.assign(tiffin, updates);
    const updatedTiffin = await tiffin.save();

    return res.status(200)
        .json(new ApiResponse(200, updatedTiffin, "Successfully Updated"))
})

const myServices = AsyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);
    if (!user)
        throw new ApiError(404, "User not found");
    const tiffins = await Tiffin.find({ owner: user._id });
    if (!tiffins)
        throw new ApiError(404, "No tiffin services found for the user");
    return res.status(200).json(new ApiResponse(200, tiffins, "Fetched user's tiffin services"));
});

const getAllTiffins = AsyncHandler(async (req, res) => {
    const { city, openingTime, closingTime, deliveryAvailable, page = 1, limit = 10, lat, lng } = req.query;

    const filters = {};
    if (city) filters["address.city"] = city;
    if (openingTime) filters["timings.openingTime"] = openingTime;
    if (closingTime) filters["timings.closingTime"] = closingTime;
    if (deliveryAvailable === 'true') filters.deliveryAvailable = true;
    if (deliveryAvailable === 'false') filters.deliveryAvailable = false;

    const radius = parseFloat(req.query.radius) || 3;
    const radiusInMeters = radius * 1000;

    if (lat && lng) {
        filters.location = {
            $near: {
                $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                $maxDistance: radiusInMeters
            }
        }
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.max(parseInt(limit) || 10, 1);
    const result = await Tiffin.find(filters)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 });

    const total = await Tiffin.countDocuments(filters);

    return res.status(200).json(
        new ApiResponse(200, { result, total }, "Fetched tiffins with filters")
    );
})

export {
    createTiffinService, deleteTiffinService,
    updateTiffinService, getAllTiffins, myServices
};