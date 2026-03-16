import { createApi } from "@reduxjs/toolkit/query/react";
import http from "@/utils/http";

const axiosBaseQuery =
  () =>
  async ({
    url,
    method = "get",
    data,
    params,
    responseType,
    headers,
    skipRefresh,
  }) => {
    try {
      const isBodyless = method === "get" || method === "delete";
      const config = {
        params,
        responseType,
        headers,
        skipRefresh,
      };

      const result = isBodyless
        ? await http[method](url, config)
        : await http[method](url, data, config);

      return { data: result };
    } catch (error) {
      return {
        error: {
          status: error.response?.status,
          data: error.response?.data ?? { message: error.message },
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "User",
    "Category",
    "Military",
    "Account",
    "Unit",
    "Access",
    "Backup",
    "Inventory",
    "AssignedUnit",
  ],
  endpoints: () => ({}),
});
