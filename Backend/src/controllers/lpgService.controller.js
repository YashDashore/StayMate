import { User } from "../models/User.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { Lpg } from "../models/LpgService.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createLpg = AsyncHandler(async (req, res) => {
    const { name, landline } = req.body;
    let location = req.body.location;
    let address = req.body.address;
    let timings = req.body.timings;
    let cylinder = req.body.cylinder;

    const userId = req.user?._id;
    const user = await User.findById(userId).select("userType");

    if (!user) throw new ApiError(404, "User not found");

    if (user.userType?.trim() !== "service-provider")
        throw new ApiError(403, "Only service-provider can list lpg services");

    if (typeof location === 'string') {
        try {
            location = JSON.parse(location);
        } catch {
            throw new ApiError(400, "Invalid location format");
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

    if (typeof cylinder === "string") {
        try {
            cylinder = JSON.parse(cylinder);
        } catch {
            throw new ApiError(400, "Invalid cylinder format");
        }
    }

    if (!Array.isArray(cylinder) || cylinder.length === 0) {
        throw new ApiError(400, "At least one cylinder is required");
    }

    if (!name || !timings?.openingTime || !timings?.closingTime || !location?.coordinates?.length ||
        !address?.city || !address?.state || !address?.pincode)
        throw new ApiError(400, "Certain fields are required");

    const cleanedCylinders = cylinder.map((c) => {
        if (!c?.capacity) {
            throw new ApiError(400, "Cylinder capacity is required");
        }

        return {
            capacity: c.capacity,
            newCylinder: c.newCylinder || "",
            refill: c.refill || ""
        };
    });

    const createdLpg = await Lpg.create({
        owner: userId,
        name,
        location,
        address,
        timings,
        landline,
        cylinder: cleanedCylinders
    });

    if (!createdLpg)
        throw new ApiError(500, "Server error in creating lpg listing");

    return res.status(201)
        .json(new ApiResponse(201, createdLpg, "LPG center listing successfully created"));
});

const deleteLpg = AsyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lpgId = req.params.id;

    const user = await User.findById(userId).select("_id");
    if (!user) throw new ApiError(404, "User not found");

    const lpg = await Lpg.findById(lpgId);
    if (!lpg) throw new ApiError(404, "LPG center not found");

    if (lpg.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Only owner can delete the LPG center");
    }

    await Lpg.findByIdAndDelete(lpgId);
    return res.status(200)
        .json(new ApiResponse(200, null, "LPG center deleted successfully"));
});

const getMyServices = AsyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId).select("_id");
    if (!user) throw new ApiError(404, "User not found");

    const lpgs = await Lpg.find({ owner: userId });
    if (!lpgs)
        throw new ApiError(404, "No LPG services found for this owner");
    return res.status(200)
        .json(new ApiResponse(200, lpgs, "LPG services retrieved successfully"));
});

export {
    createLpg,
    deleteLpg,
    getMyServices
}