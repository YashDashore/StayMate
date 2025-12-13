import mongoose from "mongoose";

// Tiffin subscription facilities...

const TiffinSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
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
        state: String,
        street: String,
        pincode: String,
    },
    deliveryAvailable: {
        type: Boolean,
        default: false
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
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
    price: {
        perPlate: { type: String, required: true },
        oneTimeMonthly: { type: String },
        twoTimeMonthly: { type: String }
    },
    photos: {
        type: [
            {
                url: { type: String },
                publicId: { type: String }
            }
        ],
        default: []
    },
    landline: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

TiffinSchema.index({ location: '2dsphere' });

export const Tiffin = mongoose.model("Tiffin", TiffinSchema)