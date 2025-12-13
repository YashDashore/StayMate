import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { Room } from "./Room.model.js";
import { Tiffin } from "./Tiffin.model.js";
import { HouseService } from "./HouseService.model.js";
import { Wifi } from "./WifiSharing.model.js";
import { Lpg } from "./LpgService.model.js";
import { RoommateFinder } from "./FindRoommate.model.js";
import { Booking } from "./Booking.model.js";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true,
        unique: true
    },
    userType: {
        type: String,
        enum: ['tenant', 'room-owner', 'service-provider'],
        required: true,
        default: 'tenant'
    },
    occupation: {
        type: String,
        enum: ["student", "working-professional", "other"],
    },
    profilePhoto: { type: String },
    serverRefreshToken: {
        type: String,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: { type: String },
    otpExpiry: { type: Date },
    lastOtpSentAt : {type : Date}
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next()
});

UserSchema.pre("remove", async function (next) {
    const userId = this._id;
    await Room.deleteMany({ owner: userId });
    await Tiffin.deleteMany({ owner: userId });
    await HouseService.deleteMany({ provider: userId });
    await Wifi.deleteMany({ owner: userId });
    await Lpg.deleteMany({ owner: userId });
    await Booking.deleteMany({
        $or: [{ user: userId }, { provider: userId }]
    })

    const roommatePosts = await RoommateFinder.find({
        $or: [
            { createdBy: userId },
            { currentlyLivingUsers: userId }
        ]
    });

    for (const post of roommatePosts) {
        post.currentlyLivingUsers = post.currentlyLivingUsers.filter(
            id => id.toString() !== userId.toString()
        );

        if (post.createdBy.toString() === userId.toString()) {
            if (post.currentlyLivingUsers.length > 0) {
                post.createdBy = post.currentlyLivingUsers[0];
            }
            else {
                await RoommateFinder.deleteOne({ _id: post._id });
                continue;
            }
        }

        await post.save();
    }

    next();
});

UserSchema.methods.isPasswordCorrect = async function (password) {
    const valid = await bcrypt.compare(password, this.password);
    return valid;
};

UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            username: this.username,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
};

UserSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
};


export const User = mongoose.model("User", UserSchema);