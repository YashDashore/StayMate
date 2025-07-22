import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rentPerMonth: {
        type: Number,
        min: [0, "Rent must be positive"],
        required: true
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    photos: {
        type: [String]
    },
    category: {
        type: String,
        enum: ["1RK", "1BHK", "2BHK", "3BHK"],
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    otherServices: {
        type: [String]
    },
    customerGender: {
        type: String,
        enum: ["Male", "Female", "Any"],
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    address: {
        city: { type: String, required: true },
        state: { type: String, required: true },
        street: { type: String },
        pincode: { type: String, required: true }
    }
}, { timestamps: true });

RoomSchema.index({ location: '2dsphere' });

export const Room = mongoose.model("Room", RoomSchema);