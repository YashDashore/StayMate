//  Future plans...

import mongoose from "mongoose";

const WifiSharingSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    wifiCompany: {
        type: String,
        required: true
    },
    speedMbps: {
        type: Number,
        required: true
    },
    coverageRadius: {
        type: Number,
        default: 10, // in meters (typical range for repeater setups)
        min: 0,
        max: 50
    },
    noOfUsers: {
        type: Number,
        required: true
    },
    totalBill: {
        type: Number,
        required: true
    },
    perUserCost: {
        type: Number,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number]
        }
    },

}, { timestamps: true });

WifiSharingSchema.index({ location: '2dsphere' });

export const Wifi = mongoose.model("Wifi", WifiSharingSchema);