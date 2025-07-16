import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // person who pays (e.g., tenant)
        required: true
    },
    serviceProvider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // person who receives the money (e.g., PG owner)
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    serviceType: {
        type: String,
        enum: ["room", "tiffin", "lpg", "house-service"],
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },
    method: {
        type: String,
        enum: ["upi", "card", "netbanking", "cod"],
        required: true
    },
    provider: {
        type: String,
        enum: ["Razorpay", "COD"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    },
    paymentId: String, // Razorpay/Stripe txn ID
    orderId: String,   // Razorpay order ID

}, { timestamps: true });

export const Payment = mongoose.model("Payment", PaymentSchema);
