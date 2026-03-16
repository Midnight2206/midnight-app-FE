import { baseApi } from "@/store/baseApi";

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategoryWarehouses: builder.query({
      query: () => ({
        url: "/inventories/warehouses",
        method: "get",
      }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: "Inventory", id: "WAREHOUSE_LIST" }],
    }),

    createCategoryWarehouse: builder.mutation({
      query: (data) => ({
        url: "/inventories/warehouses",
        method: "post",
        data,
      }),
      invalidatesTags: [{ type: "Inventory", id: "WAREHOUSE_LIST" }],
    }),

    updateCategoryWarehouse: builder.mutation({
      query: ({ warehouseId, ...data }) => ({
        url: `/inventories/warehouses/${warehouseId}`,
        method: "patch",
        data,
      }),
      invalidatesTags: [{ type: "Inventory", id: "WAREHOUSE_LIST" }],
    }),

    deleteCategoryWarehouse: builder.mutation({
      query: (warehouseId) => ({
        url: `/inventories/warehouses/${warehouseId}`,
        method: "delete",
      }),
      invalidatesTags: [{ type: "Inventory", id: "WAREHOUSE_LIST" }],
    }),

    getWarehouseCategoryItems: builder.query({
      query: ({ warehouseId, search, page, limit } = {}) => ({
        url: `/inventories/warehouses/${warehouseId}/category-items`,
        method: "get",
        params: { search, page, limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, arg) => [
        { type: "Inventory", id: `WAREHOUSE_CATEGORY_ITEMS-${arg?.warehouseId || "none"}` },
      ],
    }),

    removeWarehouseCategoryItem: builder.mutation({
      query: ({ warehouseId, ...data }) => ({
        url: `/inventories/warehouses/${warehouseId}/category-items`,
        method: "delete",
        data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Inventory", id: `WAREHOUSE_CATEGORY_ITEMS-${arg?.warehouseId || "none"}` },
        { type: "Inventory", id: "WAREHOUSE_LIST" },
      ],
    }),

    adjustWarehouseCategoryStock: builder.mutation({
      query: (data) => ({
        url: "/inventories/warehouses/category-stocks/adjust",
        method: "post",
        data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Inventory", id: `WAREHOUSE_CATEGORY_ITEMS-${arg?.warehouseId || "none"}` },
        { type: "Inventory", id: "WAREHOUSE_LIST" },
      ],
    }),

    transferWarehouseCategoryStock: builder.mutation({
      query: (data) => ({
        url: "/inventories/warehouses/category-stocks/transfer",
        method: "post",
        data,
      }),
      invalidatesTags: [
        { type: "Inventory", id: "WAREHOUSE_LIST" },
      ],
    }),

  }),
});

export const {
  useGetCategoryWarehousesQuery,
  useCreateCategoryWarehouseMutation,
  useUpdateCategoryWarehouseMutation,
  useDeleteCategoryWarehouseMutation,
  useGetWarehouseCategoryItemsQuery,
  useRemoveWarehouseCategoryItemMutation,
  useAdjustWarehouseCategoryStockMutation,
  useTransferWarehouseCategoryStockMutation,
} = inventoryApi;
