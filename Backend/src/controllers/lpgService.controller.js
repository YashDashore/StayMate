import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Lpg } from "../models/LpgService.model.js";
import e from "express";

const createLpgService = AsyncHandler(async (req, res) => {
    const { name, location, capacity, address, timings, landline } = req.body;
    const userId = req.user?._id;
    if (!name || name.trim() === "" ||
        !location?.coordinates ||
        !address?.city ||
        !address?.state ||
        !address?.pincode ||
        !timings?.openingTime || 
        !timings?.closingTime ||
        !Array.isArray(capacity) ||
        capacity.length === 0 ||
        !capacity.every(c => c.size && c.size.trim() != "" && c.newCylinderPrice != null && c.refillPrice != null)) {
        throw new ApiError(400, "Certain fields are required");
    }
    const createdService = await Lpg.create({
        owner: userId,
        name,
        capacity,
        location,
        address,
        timings,
        landline
    })
    if (!createdService)
        throw new ApiError(500, "Service listing is not created");
    return res.status(201)
        .json(new ApiResponse(201, createdService, "Successfully created lpg service listing"));
})

const deleteLpgService = AsyncHandler(async (req, res) => {
    const serviceId = req.params.id;
    const userId = req.user?._id;

    if (!serviceId)
        throw new ApiError(400, "Service id not found");
    const service = await Lpg.findById(serviceId);

    if (!service)
        throw new ApiError(404, "Service not found");
    if (userId.toString() !== service.owner.toString())
        throw new ApiError(403, "Only the owner can delete the service");

    const deletedService = await Lpg.findByIdAndDelete(serviceId);
    if (!deletedService)
        throw new ApiError(500, "Error occurred in deleting");

    return res.status(200)
        .json(new ApiResponse(200, {}, "Successfully deleted the service"));
})

const updateLpgService = AsyncHandler(async (req, res) => {
    // Add new capacity cylinder, update the old one details
    const serviceId = req.params.id;
    const userId = req.user?._id;

    if (!serviceId)
        throw new ApiError(400, "Service id not found");
    const service = await Lpg.findById(serviceId);

    if (!service)
        throw new ApiError(404, "Service not found");
    if (userId.toString() !== service.owner.toString())
        throw new ApiError(403, "Only the owner can make changes");

    const allowfields = ["name", "location", "landline"]

    const updates = {};
    for (const key of allowfields) {
        if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
    }
    if (req.body.address) {
        service.address = {
            ...service.address,
            ...req.body.address
        };
    }

    if (req.body.timings) {
        service.timings = {
            ...service.timings,
            ...req.body.timings
        };
    }
    Object.assign(service, updates);
    const updatedService = await service.save();

    return res.status(200)
        .json(new ApiResponse(200, updatedService, "Successfully updated the details"));
})

const updateLpgCapacity = AsyncHandler(async (req, res) => {
    const serviceId = req.params.id;
    const userId = req.user._id;
    const { size, newSize, newCylinderPrice, refillPrice } = req.body;

    if (!serviceId)
        throw new ApiError(400, "Service Id not found");

    const service = await Lpg.findById(serviceId);
    if (!service)
        throw new ApiError(404, "Service not found");

    if (service.owner.toString() != userId.toString())
        throw new ApiError(403, "Only owner can make changes");

    if (!size || size.trim() === "") {
        throw new ApiError(400, "Original cylinder size is required");
    }

    const existedService = service.capacity.find((c) => c.size.trim() === size.trim());
    if (existedService) {
        if (newCylinderPrice) existedService.newCylinderPrice = newCylinderPrice;
        if (refillPrice) existedService.refillPrice = refillPrice;
        if (newSize && newSize.trim() !== "") existedService.size = newSize;
    }
    else {
        if (!newCylinderPrice || !refillPrice) {
            throw new ApiError(400, "New cylinders must have price and refill price");
        }
        service.capacity.push({ size, newCylinderPrice, refillPrice });
    }

    await service.save();
    return res.status(200)
        .json(new ApiResponse(200, service, existedService ? "Cylinder updated" : "Cylinder added"));
})

const getAllLpgServices = AsyncHandler(async (req, res) => {
    const { city, openingTime, closingTime, page = 1, limit = 10, lat, lng } = req.query;

    const filter = {};
    if (city) filter["address.city"] = city;
    if (openingTime) filter["timings.openingTime"] = openingTime;
    if (closingTime) filter["timings.closingTime"] = closingTime;

    const radius = parseFloat(req.query.radius) || 3;
    const radiusInMeters = radius * 1000;

    if (lat && lng) {
        filter.location = {
            $near: {
                $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                $maxDistance: radiusInMeters
            }
        }
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.max(parseInt(limit) || 10, 1);
    const result = await Lpg.find(filter)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 });

    const total = await Lpg.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, { result, total }, "Fetched LPG service with filters")
    );
})

const getMyLpgServices = AsyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

    const services = await Lpg.find({ owner: userId })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, services, "Fetched your LPG services")
    );
});


export { createLpgService, updateLpgService, deleteLpgService, getAllLpgServices, updateLpgCapacity, getMyLpgServices }