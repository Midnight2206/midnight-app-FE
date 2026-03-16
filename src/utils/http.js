import axios from "axios";

/**
 * ============================================
 * PHẦN 1: KHỞI TẠO HTTP CLIENT
 * ============================================
 */
const baseURL = import.meta.env.VITE_BASE_API;

const httpClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

/**
 * ============================================
 * PHẦN 2: BIẾN DÙNG CHO REFRESH TOKEN
 * ============================================
 */
let isRefreshing = false;
let failedQueue = [];

const resolveQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

/**
 * ============================================
 * PHẦN 3: REFRESH TOKEN
 * ============================================
 * ⚠️ Server sẽ đọc refresh token từ cookie
 */
const refreshToken = async () => {
  await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
};

/**
 * ============================================
 * PHẦN 4: RESPONSE INTERCEPTOR
 * ============================================
 */
httpClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Không có response → lỗi network
    if (!error.response) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response.status === 401;
    const requestUrl = String(originalRequest.url || "");
    const isRefreshEndpoint = requestUrl.includes("/auth/refresh");
    const isLoginEndpoint = requestUrl.includes("/auth/login");
    const isRegisterEndpoint = requestUrl.includes("/auth/register");
    const skipRefresh = Boolean(originalRequest?.skipRefresh);

    // ❌ Không refresh nếu:
    // - Không phải 401
    // - Là request refresh / login / register
    // - Đã retry rồi
    // - Request có skipRefresh
    if (
      !isUnauthorized ||
      isRefreshEndpoint ||
      isLoginEndpoint ||
      isRegisterEndpoint ||
      originalRequest._retry ||
      skipRefresh
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // ========================================
    // CASE 1: CHƯA REFRESH → REFRESH NGAY
    // ========================================
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        await refreshToken();
        resolveQueue();
        return httpClient(originalRequest); // retry request cũ
      } catch (refreshError) {
        resolveQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ========================================
    // CASE 2: ĐANG REFRESH → ĐẨY VÀO QUEUE
    // ========================================
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: () => resolve(httpClient(originalRequest)),
        reject,
      });
    });
  },
);

/**
 * ============================================
 * PHẦN 5: HELPER SEND REQUEST
 * ============================================
 */
const sendRequest = async (method, url, data, config = {}) => {
  const response = await httpClient.request({
    method,
    url,
    data,
    ...config,
  });

  return response.data;
};

/**
 * ============================================
 * PHẦN 6: EXPORT API METHODS
 * ============================================
 */
const http = {
  get: (url, config) => sendRequest("get", url, null, config),
  post: (url, data, config) => sendRequest("post", url, data, config),
  put: (url, data, config) => sendRequest("put", url, data, config),
  patch: (url, data, config) => sendRequest("patch", url, data, config),
  delete: (url, config) => sendRequest("delete", url, null, config),
};

export default http;
