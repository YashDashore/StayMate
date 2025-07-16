import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
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
        default: 'tenant'
    },
    occupation: {
        type: String,
        enum: ["student", "working-professional", "other"],
    },
    profilePhoto: { type: String },
}, { timestamps: true });

export const User = mongoose.model("User", UserSchema);