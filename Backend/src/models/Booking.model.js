import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    serviceType:
    {
        type: String,
        enum: ["room", "tiffin", "lpg", "house"],
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    bookingDate:
    {
        type: Date,
        default: Date.now
    },
    bookingStatus: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    },
    bookingType: {
        type: String,
        enum: ["one-time", "monthly", "weekly", "custom"],
        default: "one-time"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "cod"],
        default: "pending"
    },
    paymentMethod:
    {
        type: String,
        enum: ["upi", "card", "netbanking", "cod"],
        required: true
    },
    paymentRef:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    }
}, { timestamps: true });

export const Booking = mongoose.model("Booking", BookingSchema);
