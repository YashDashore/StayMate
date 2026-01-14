import { HouseService } from "../models/HouseService.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

const createHouseService = AsyncHandler(async (req, res) => {
    const { service, charge, timings, location } = req.body;
    const userId = req.user._id;
    if (!userId)
        throw new ApiError(404, "User id not found");
    if (!charge || !timings?.start || !timings?.end || !charge || !service || !location?.coordinates)
        throw new ApiError(400, "All fields are required");
    const createdService = await HouseService.create({
        provider: userId,
        service,
        charge,
        timings,
        location
    })
    if (!createdService)
        throw new ApiError(500, "Service cannot be created");
    res.status(201)
        .json(new ApiResponse(201, createdService, "Service successfully listed"));
})

const deleteHouseService = AsyncHandler(async (req, res) => {
    const userId = req.user._id;
    const serviceId = req.params.id;

    if (!userId)
        throw new ApiError(404, "User id not found");
    if (!serviceId)
        throw new ApiError(404, "Service id not found");

    const service = await HouseService.findById(serviceId);
    if (!service)
        throw new ApiError(404, "Service not found");

    if (userId.toString() !== service.provider.toString())
        throw new ApiError(403, "Only service provider can delete the listing")

    const deletedService = await HouseService.findByIdAndDelete(serviceId);
    if (!deletedService)
        throw new ApiError(500, "Error occurred in deleting");

    res.status(200)
        .json(new ApiResponse(200, {}, "Successfully deleted the service"));
})

const updateHouseService = AsyncHandler(async (req, res) => {
    const userId = req.user._id;
    const serviceId = req.params.id;

    if (!userId)
        throw new ApiError(404, "User id not found");
    if (!serviceId)
        throw new ApiError(404, "Service id not found");

    const existedService = await HouseService.findById(serviceId);

    if (!existedService)
        throw new ApiError(404, "Service not found");

    if (userId.toString() !== existedService.provider.toString())
        throw new ApiError(403, "Only service provider can edit the house listing");

    const allowfields = ["service", "charge", "timings", "location"]

    const updates = {};
    for (const key of allowfields) {
        if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
    }
    Object.assign(existedService, updates);
    const updatedService = await existedService.save();

    res.status(200)
        .json(new ApiResponse(200, updatedService, "Successfully updated  the service"));
})

const getAllHouseServices = AsyncHandler(async (req, res) => {
    const { city, serviceType, minCharge, maxCharge, lat, lng } = req.query;

    const filters = {};

    if (city) filters["location.city"] = city;
    if (serviceType) filters.service = serviceType;
    if (minCharge || maxCharge) {
        filters.charge = {};
        if (minCharge) filters.charge.$gte = Number(minCharge);
        if (maxCharge) filters.charge.$lte = Number(maxCharge);
    }

    const radius = parseFloat(req.query.radius) || 6;
    const radiusInMeters = radius * 1000;

    if (lat && lng) {
        filters.location = {
            $near: {
                $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                $maxDistance: radiusInMeters
            }
        };
    }

    const services = await HouseService.find(filters).sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, services, "Fetched house services"));
});

export { createHouseService, deleteHouseService, updateHouseService, getAllHouseServices };