import {AsyncHandler} from "../utils/AsyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/User.model.js";
import { UploadOnCloud } from "../utils/CloudinaryUpload.js";

const registerUser = AsyncHandler(async (req, res) => {
    const { username, email, password, contact, userType, occupation } = req.body;
    if ([username, email, password, contact, userType].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const alreadyExisted = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (alreadyExisted) {
        throw new ApiError(409, "User already existed - Username or email");
    }
    let profilePhoto1;
    const profilePhotoLocalPath = req.files?.Profile_Photo[0]?.path;
    if (profilePhotoLocalPath)
        profilePhoto1 = await UploadOnCloud(profilePhotoLocalPath);

    const user = await User.create({
        username,
        email,
        password,
        contact,
        userType,
        occupation,
        profilePhoto: profilePhoto1?.public_id || null
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser)
        throw new ApiError(500, "User not created");
    return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"))
})

const generateAccessAndRefreshTokens = async (user_Id) => {
    try {
        const user = await User.findById(user_Id);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Cannot generate access and refreshj tokens");
    }
}

const loginUser = AsyncHandler(async (req, res) => {
    const { identifier, password } = req.body
    if (!identifier || !password)
        throw new ApiError(422, "Username/Email and password are required");
    const userExist = await User.findOne({
        $or: [{ username: identifier }, { email: identifier }]
    })
    if (!userExist)
        throw new ApiError(401, "Invalid Username or password");
    const passwordCheck = await userExist.isPasswordCorrect(password);
    if (!passwordCheck)
        throw new ApiError(401, "Invalid Password");
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userExist._id);

    const UpdatedUser = await User.findById(userExist._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: UpdatedUser },
            "User successfully logged In"))
})
export {
    registerUser,
    loginUser
}