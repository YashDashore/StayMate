import mongoose from "mongoose";

const ConnectDB = async () => {
    try {
        const ConnectionInst = await mongoose.connect(
              `${process.env.MONGODB_URI}/${process.env.DB_NAME}`
        );
        console.log("DB connected");
    } catch (error) {
        console.log("DB Connection Error ", error);
        process.exit(1);
    }
};

export default ConnectDB;