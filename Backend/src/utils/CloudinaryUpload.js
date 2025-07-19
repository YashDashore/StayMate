import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UploadOnCloud = async (FileOnServer) => {
    try {
        if (!FileOnServer) return null;
        const response = await cloudinary.uploader.upload(FileOnServer, {
            resource_type: "auto",
        });
        fs.unlinkSync(FileOnServer);
        return response;
    } catch (error) {
        console.log("Errorrrrr");
        fs.unlinkSync(FileOnServer);
        return null;
    }
};

const DeleteFromCloud = async (PublicId) => {
    try {
        await cloudinary.uploader.destroy(PublicId);
        return null;
    } catch (error) {
        throw new ApiError(500, "Image on cloud cannot be deleted");
    }
}

export { UploadOnCloud, DeleteFromCloud };