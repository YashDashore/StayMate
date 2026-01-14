import Api from "./api";

export const createTiffin = async (tiffinData) => {
    try {
        const response = await Api.post("/tiffin/create", tiffinData);
        return response.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to create tiffin";
        throw new Error(errMsg);
    }
}

export const updateTiffin = async (id, data) => {
    try {
        const response = await Api.patch(`/tiffin/update/${id}`, data);
        return response.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to update tiffin";
        throw new Error(errMsg);
    }
}

export const deleteTiffin = async (id) => {
    try {
        const response = await Api.delete(`/tiffin/delete/${id}`);
        return response.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to delete tiffin";
        throw new Error(errMsg);
    }
}

export const getMyTiffins = async () => {
    try {
        const response = await Api.get("/tiffin/myServices");
        return response.data.data || [];
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to fetch tiffins";
        throw new Error(errMsg);
    }
};

export const getAllTiffins = async () => {
    try {
        const response = await Api.get("/tiffin/allTiffins");
        return response.data.data || [];
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to fetch tiffins";
        throw new Error(errMsg);
    }
};