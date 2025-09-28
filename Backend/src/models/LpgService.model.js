import mongoose from "mongoose";
const LpgSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    capacity: [{
        size: {
            type: String,
            required: true
        },
        newCylinderPrice: {
            type: Number,
            required: true
        },
        refillPrice: {
            type: Number,
            required: true
        }
    }],
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
        street: String,
        pincode: { type: String, required: true }
    },
    timings: {
        openingTime: {
            type: String,
            required: true,
            match: [/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid opening time format']
        },
        closingTime: {
            type: String,
            required: true,
            match: [/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid closing time format']
        }
    },
    landline: {
        type: String
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

LpgSchema.index({ location: '2dsphere' });

export const Lpg = mongoose.model("Lpg", LpgSchema);