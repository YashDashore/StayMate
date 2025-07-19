import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

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
    refreshToken: {
        type: String
    }
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next()
});

UserSchema.methods.isPasswordCorrect = async function (password) {
    const valid = await bcrypt.compare(password, this.password);
    return valid;
};

UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            Username: this.Username,
            Email: this.Email,
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