import { AsyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
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

const accessRefreshToken = AsyncHandler(async (req, res) => {
    const UserRefreshToken = req.cookies?.refreshToken || req.body.refresh_Token;
    if (!UserRefreshToken)
        throw new ApiError(401, "User side refresh token is not accessed");
    try {
        const decodedUserRefreshToken = jwt.verify(UserRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedUserRefreshToken._id);
        if (!user)
            throw new ApiError(403, "User not found");
        if (UserRefreshToken !== user?.refresh_Token)
            throw new ApiError(403, "Refresh token does not matched");
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
        const options = {
            httpOnly: true,
            secure: true
        }
        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, {}, "Successfully updated access and refresh token")
            )
    } catch (error) {
        throw new ApiError(403, error?.message || "Invalid refresh token")
    }
})

const logoutUser = AsyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: { refresh_Token: undefined }
        },
        {
            new: true
        });

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Successfully logged out user"));
})

const updatePassword = AsyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old and new password are required");
    }
    const verifyPassword = await user.isPasswordCorrect(oldPassword)
    if (!verifyPassword)
        throw new ApiError(400, "Invalid old Password");
    console.log(newPassword)
    user.password = newPassword
    await user.save();
    return res.status(200)
        .json(
            new ApiResponse(200, {}, "Successfully Password changed")
        )
})

const updateDetails = AsyncHandler(async (req, res) => {
    const { username, contact, userType, occupation } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user)
        throw new ApiError(404, "User not found");
    if (username && username != user.username) {
        const existedUser = await User.findOne({ username });
        if (existedUser)
            throw new ApiError(403, "Username already taken");
        user.username = username;
    }
    if (contact)
        user.contact = contact;
    if (userType)
        user.userType = userType;
    if (occupation)
        user.occupation = occupation;

    const newProfilePath = req.files?.Profile_Photo?.[0]?.path;

    if (newProfilePath) {

        const newProfile = await UploadOnCloud(newProfilePath);
        if (!newProfile) throw new ApiError(400, "Image upload failed");

        if (user.profilePhoto) await DeleteOnCloud(user.profilePhoto);
        user.profilePhoto = newProfile.public_id;
    }
    await user.save({ validateBeforeSave: false });
    const updatedUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, updatedUser, "Details updated succesfully"));
})

const deleteUser = AsyncHandler(async (req, res) => {
    const { password } = req.body;
    if (!password)
        throw new ApiError(400, "Enter password");
    const user = await User.findById(req.user?._id);
    const checkPass = await user.isPasswordCorrect(password);
    if (!checkPass)
        throw new ApiError(401, "Incorrect Password");
    const deletedUser = await user.deleteOne();
    if (!deletedUser)
        throw new ApiError(404, "User not found");
    res.status(200)
        .json(new ApiResponse(200, {}, "User deleted Successfully"));
})

const getUserDetails = AsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    if (!user)
        throw new ApiError(404, "User not found");
    return res.status(200)
        .json(new ApiResponse(200, user, "User details"));
})

export {
    registerUser, loginUser,
    logoutUser, accessRefreshToken,
    updatePassword, deleteUser,
    getUserDetails, updateDetails
}