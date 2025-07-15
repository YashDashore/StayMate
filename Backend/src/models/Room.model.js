import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rentPerMonth: {
        type: Number,
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
        enum: ["1RK", "1BHK", "2BHK", "3BHK"]
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    otherServices: {
        type: [String]
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
        city: String,
        state: String,
        street: String,
        pincode: String,
    }
}, { timestamps: true });

RoomSchema.index({ location: '2dsphere' });

export const Room = mongoose.model("Room", RoomSchema);