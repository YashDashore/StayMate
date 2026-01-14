import Api from "./api";

export const createRoom = async (roomData) => {
    try {
        const response = await Api.post("/room/create", roomData);
        return response.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to create room";
        throw new Error(errMsg);
    }
}

export const updateRoom = async (id, data) => {
    try {
        const response = await Api.patch(`/room/update/${id}`, data);
        return response.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to update room";
        throw new Error(errMsg);
    }
}

export const deleteRoom = async (id) => {
    try {
        const response = await Api.delete(`/room/delete/${id}`);
        return response.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to delete room";
        throw new Error(errMsg);
    }
}

export const getMyRooms = async () => {
    try {
        const response = await Api.get("/room/myRooms");
        return response.data.data || [];
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to fetch rooms";
        throw new Error(errMsg);
    }
};

export const getAllRooms = async () => {
    try {
        const response = await Api.get("/room/allRooms");
        return response.data.data || [];
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to fetch rooms";
        throw new Error(errMsg);
    }
};