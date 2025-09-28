import mongoose from "mongoose"

const HouseServiceSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    service: {
        type: String,
        required: true
    },
    charge: {
        type: Number,
        required: true
    },
    timings: {
        start: {
            type: String,
            match: [/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid opening time format']
        },
        end: {
            type: String,
            match: [/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid opening time format']
        }
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    }
}, { timestamps: true });

HouseServiceSchema.index({ location: "2dsphere" });

export const HouseService = mongoose.model("HouseService", HouseServiceSchema);