import Api from "./api";

export const registerUser = async (formData) => {
    try {
        const response = await Api.post("/user/register", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Registration failed"
        throw new Error(errMsg);
    }
}

export const loginUser = async (data) => {
    try {
        const response = await Api.post("/user/login", data);
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
        }
        return response.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Login failed";
        throw new Error(errMsg);
    }
}

export const logoutUser = async () => {
    try {
        const res = await Api.post("/user/logout", {});
        localStorage.removeItem("token");
        return res.data.message || "Logout successful";
    } catch (error) {
        throw new Error("Logout failed");
    }
}

export const UpdateUser = async (data) => {
    try {
        const response = await Api.patch("/user/update", data);
        return response.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Editing failed"
        throw new Error(errMsg);
    }
}

export const changePassword = async (data) => {
    try {
        const response = await Api.patch("/user/change-password", data);
        return response.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Password change failed"
        throw new Error(errMsg);
    }
}

export const deleteUser = async (data) => {
    try {
        const res = await Api.delete("/user/delete", { data });
        return res.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Account delete failed";
        throw new Error(errMsg);
    }
};

export const verifyEmailOtp = async (data) => {
    try {
        const res = await Api.post("/user/verify", data);
        return res.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "OTP verification failed";
        throw new Error(errMsg);
    }
};

export const resendOtp = async () => {
    try {
        const res = await Api.post("/user/resendOtp");
        return res.data.message;
    } catch (error) {
        const errMsg = error.response?.data?.message || "Resend OTP failed";
        throw new Error(errMsg);
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await Api.get("/user/details", {
            withCredentials: true,
        });
        return response.data.data || [];
    } catch (error) {
        const errMsg = error.response?.data?.message || "Failed to fetch current user";
        throw new Error(errMsg);
    }
}