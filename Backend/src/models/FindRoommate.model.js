import mongoose from "mongoose";

const RoommateFinderSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    postType: {
        type: String,
        enum: ["have-room", "need-room"],
        required: true
    },
    rent: {
        type: Number,
        required: function () {
            return this.postType === "have-room";
        }
    },
    otherServices: {
        type: [String]
    },

    genderPreference: {
        type: String,
        enum: ["male", "female", "any"],
        default: "any"
    },
    currentlyLivingUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    lookingFor: { //No of more people required
        type: Number,
        required: function () {
            return this.postType === "have-room";
        }
    },
    roomImages: {
        type: [String],
    },
    availableFrom: {
        type: Date,
    },
    address: {
        city: String,
        state: String,
        street: String,
        pincode: String,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        }
    },
}, { timestamps: true });

RoommateFinderSchema.index({ location: '2dsphere' });

export const RoommateFinder = mongoose.model("RoommateFinder", RoommateFinderSchema);