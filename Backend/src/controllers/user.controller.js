import { AsyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/User.model.js";
import { UploadOnCloud, DeleteFromCloud } from "../utils/CloudinaryUpload.js";
import { Email } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

const sendOtp = AsyncHandler(async (user) => {
    try {
        const now = new Date();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(now.getTime() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.lastOtpSentAt = now;

        await user.save();

        await Email({
            to: user.email,
            subject: "StayMate : Email Verification OTP",
            text: `Your OTP is ${otp}. It is valid for 10 minutes. Thank you for registering with StayMate and You are Dazzling!`,
            html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
        });
    } catch (error) {
        throw new ApiError(500, "Failed to send otp");
    }
});

const registerUser = AsyncHandler(async (req, res) => {
    const { username, email, password, contact, userType, occupation } = req.body;
    if ([username, email, password, contact, userType].some((field) => !field || field.trim() === "")) {
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
        profilePhoto: profilePhoto1 ? { url: profilePhoto1.secure_url || profilePhoto1.url, publicId: profilePhoto1.public_id } : null
    })

    await sendOtp(user);

    const createdUser = await User.findById(user._id).select("-password -serverRefreshToken -otp -otpExpiry");
    if (!createdUser)
        throw new ApiError(500, "User not created");
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered. Verify Email."))
})

const verifyOtp = AsyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp)
        throw new ApiError(400, "Both email and otp are required");

    const user = await User.findOne({ email });
    if (!user)
        throw new ApiError(404, "User not exist");

    if (otp !== user.otp || new Date(user.otpExpiry).getTime() < Date.now())
        throw new ApiError(401, "Invalid otp or Otp expired.");

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.lastOtpSentAt = undefined;

    await user.save();
    return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
})

const resendOtp = AsyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email)
        throw new ApiError(400, "Enter email again");

    const user = await User.findOne({ email });
    if (!user)
        throw new ApiError(404, "User not found");

    if (user.lastOtpSentAt && Date.now() - new Date(user.lastOtpSentAt).getTime() < 60 * 1000) {
        throw new ApiError(429, "Please wait 1 minute before requesting a new OTP");
    }

    await sendOtp(user);

    return res.status(200).json(new ApiResponse(200, {}, "OTP resent successfully"));
});

const generateAccessAndRefreshTokens = async (user_Id) => {
    try {
        const user = await User.findById(user_Id);
        const accessToken = user.generateAccessToken()
        const userRefreshToken = user.generateRefreshToken()
        user.serverRefreshToken = userRefreshToken;

        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken: userRefreshToken };
    } catch (error) {
        throw new ApiError(500, "Cannot generate access and refresh tokens");
    }
}

const loginUser = AsyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password)
        throw new ApiError(422, "Username/Email and password are required");

    const userExist = await User.findOne({
        $or: [{ username: identifier }, { email: identifier }]
    })
    if (!userExist)
        throw new ApiError(401, "Invalid Username or password");

    if (!userExist.isVerified) {
        throw new ApiError(403, "Please verify your email before logging in");
    }

    const passwordCheck = await userExist.isPasswordCorrect(password);
    if (!passwordCheck)
        throw new ApiError(401, "Invalid Password");
    const { accessToken, refreshToken: userRefreshToken } = await generateAccessAndRefreshTokens(userExist._id);

    const UpdatedUser = await User.findById(userExist._id).select("-password -serverRefreshToken");
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", userRefreshToken, options)
        .json(new ApiResponse(200, { user: UpdatedUser },
            "User successfully logged In"))
})

const accessRefreshToken = AsyncHandler(async (req, res) => {
    const UserRefreshToken = req.cookies?.refreshToken || req.body.userRefreshToken;
    if (!UserRefreshToken)
        throw new ApiError(401, "User side refresh token is not accessed");
    try {
        const decodedUserRefreshToken = jwt.verify(UserRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedUserRefreshToken.id);
        if (!user)
            throw new ApiError(403, "User not found");
        if (UserRefreshToken !== user?.serverRefreshToken)
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
            $set: { serverRefreshToken: undefined }
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
    if (!user) throw new ApiError(404, "User not found");
    const verifyPassword = await user.isPasswordCorrect(oldPassword)
    if (!verifyPassword)
        throw new ApiError(400, "Invalid old Password");
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

        // delete old profile photo (handle both object and string legacy value)
        const idToDeleteOld = user.profilePhoto ? (user.profilePhoto.publicId || user.profilePhoto.url || user.profilePhoto) : null;
        if (idToDeleteOld) await DeleteFromCloud(idToDeleteOld);
        user.profilePhoto = { url: newProfile.secure_url || newProfile.url, publicId: newProfile.public_id };
    }
    await user.save({ validateBeforeSave: false });
    const updatedUser = await User.findById(user._id).select("-password -serverRefreshToken");

    return res.status(200).json(new ApiResponse(200, updatedUser, "Details updated succesfully"));
})

const deleteUser = AsyncHandler(async (req, res) => {
    const { password } = req.body;
    if (!password)
        throw new ApiError(400, "Enter password");
    const user = await User.findById(req.user?._id);
    if (!user)
        throw new ApiError(404, "User not found");
    const checkPass = await user.isPasswordCorrect(password);
    if (!checkPass)
        throw new ApiError(401, "Incorrect Password");
    
    const idToDeleteProfile = user.profilePhoto ? (user.profilePhoto.publicId || (typeof user.profilePhoto === 'string' ? user.profilePhoto : user.profilePhoto.url)) : null;

    if (idToDeleteProfile) {
    try {
        await DeleteFromCloud(idToDeleteProfile);
    } catch (error) {
        console.error("Cloud delete failed:", error);
    }
}

    const deletedUser = await User.findByIdAndDelete(req.user?._id);
    if (!deletedUser)
        throw new ApiError(400, "Error occurred in deleting user");
    res.status(200)
        .json(new ApiResponse(200, {}, "User deleted Successfully"));
})

const getUserDetails = AsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -serverRefreshToken");
    if (!user)
        throw new ApiError(404, "User not found");
    return res.status(200)
        .json(new ApiResponse(200, user, "User details"));
})


//  forget password

export {
    registerUser, loginUser,
    logoutUser, accessRefreshToken,
    updatePassword, deleteUser,
    getUserDetails, updateDetails, verifyOtp, resendOtp
}