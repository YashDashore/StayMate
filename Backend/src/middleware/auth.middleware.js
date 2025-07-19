import { AsyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/User.model";
import jwt from "jsonwebtoken"

export const verifyJWT = AsyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token)
            throw new ApiError(401, "Token not found");
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id)
        if (!user)
            throw new ApiError(401, "Invalid access Token");
        req.user = user;
        next();
    }
    catch (error) {
        throw new ApiError(403, error?.message || "Cannot verify JWT");
    }
})