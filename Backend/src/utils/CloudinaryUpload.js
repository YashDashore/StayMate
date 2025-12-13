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
        if (FileOnServer && fs.existsSync(FileOnServer)) fs.unlinkSync(FileOnServer);
        return response;
    } catch (error) {
        console.log("Errorrrrr");
        if (FileOnServer && fs.existsSync(FileOnServer)) fs.unlinkSync(FileOnServer);
        return null;
    }
};

const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    try {
        // Extract the public id from the URL, handling optional versioning
        const match = url.match(/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
        return match ? decodeURIComponent(match[1]) : null;
    } catch (error) {
        return null;
    }
};

const DeleteFromCloud = async (PublicIdOrUrl) => {
    try {
        let publicId = PublicIdOrUrl;
        if (!publicId) throw new ApiError(400, "Invalid publicId or URL");
        if (typeof PublicIdOrUrl === 'string' && PublicIdOrUrl.startsWith('http')) {
            const parsedId = getPublicIdFromUrl(PublicIdOrUrl);
            if (parsedId) publicId = parsedId;
        }
        await cloudinary.uploader.destroy(publicId);
        return null;
    } catch (error) {
        throw new ApiError(500, "Image on cloud cannot be deleted");
    }
}

export { UploadOnCloud, DeleteFromCloud, getPublicIdFromUrl };