import axios from "axios";

const Api = axios.create({
  baseURL: "http://localhost:4000/pgHelper/v1",
  withCredentials: true,
});

Api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

Api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/user/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const refreshRes = await Api.get("/user/refresh-token");

        const newToken = refreshRes.data?.token;
        if (newToken) localStorage.setItem("token", newToken);

        return Api(originalRequest);
      } catch (err) {
        localStorage.removeItem("token");
        alert("Session expired. Please login again.");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default Api;
