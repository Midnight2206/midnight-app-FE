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
      const config = {
        params,
        responseType,
        headers,
        skipRefresh,
      };

      let result;
      if (method === "get") {
        result = await http[method](url, config);
      } else if (method === "delete") {
        result = await http.delete(url, {
          ...config,
          data,
        });
      } else {
        result = await http[method](url, data, config);
      }

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
