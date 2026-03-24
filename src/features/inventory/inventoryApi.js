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
      invalidatesTags: [{ type: "Inventory", id: "WAREHOUSE_LIST" }],
    }),

    getAllocationServiceLifeRules: builder.query({
      query: (params = {}) => ({
        url: "/categories/allocation-service-life-rules",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Inventory", id: "SERVICE_LIFE_RULE_LIST" }],
    }),

    createAllocationServiceLifeRule: builder.mutation({
      query: (data) => ({
        url: "/categories/allocation-service-life-rules",
        method: "post",
        data,
      }),
      invalidatesTags: [{ type: "Inventory", id: "SERVICE_LIFE_RULE_LIST" }],
    }),

    updateAllocationServiceLifeRule: builder.mutation({
      query: ({ ruleId, ...data }) => ({
        url: `/categories/allocation-service-life-rules/${ruleId}`,
        method: "patch",
        data,
      }),
      invalidatesTags: [{ type: "Inventory", id: "SERVICE_LIFE_RULE_LIST" }],
    }),

    deleteAllocationServiceLifeRule: builder.mutation({
      query: ({ ruleId }) => ({
        url: `/categories/allocation-service-life-rules/${ruleId}`,
        method: "delete",
      }),
      invalidatesTags: [{ type: "Inventory", id: "SERVICE_LIFE_RULE_LIST" }],
    }),

    getAllocationServiceLifeEditor: builder.query({
      query: ({ typeId, unitId } = {}) => ({
        url: "/categories/allocation-service-life-rules/editor",
        method: "get",
        params: { typeId, unitId },
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: (result, error, arg) => [
        { type: "Inventory", id: `SERVICE_LIFE_EDITOR-${arg?.typeId || "none"}` },
        { type: "Inventory", id: "SERVICE_LIFE_RULE_LIST" },
      ],
    }),

    saveAllocationServiceLifeEditor: builder.mutation({
      query: (data) => ({
        url: "/categories/allocation-service-life-rules/editor",
        method: "put",
        data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Inventory", id: `SERVICE_LIFE_EDITOR-${arg?.typeId || "none"}` },
        { type: "Inventory", id: "SERVICE_LIFE_RULE_LIST" },
      ],
    }),

    getAllocationIssueHistory: builder.query({
      query: (params = {}) => ({
        url: "/inventories/allocation-issues/history",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: (result, error, arg) => [
        { type: "Inventory", id: `ISSUE_HISTORY-${arg?.militaryId || "none"}` },
      ],
    }),

    getInventoryItems: builder.query({
      query: (params = {}) => ({
        url: "/inventories/items",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Inventory", id: "ITEM_LIST" }],
    }),

    getAllocationModes: builder.query({
      query: (params = {}) => ({
        url: "/allocation-modes",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Inventory", id: "ALLOCATION_MODE_LIST" }],
    }),

    createAllocationMode: builder.mutation({
      query: (data) => ({
        url: "/allocation-modes",
        method: "post",
        data,
      }),
      invalidatesTags: [{ type: "Inventory", id: "ALLOCATION_MODE_LIST" }],
    }),

    updateAllocationMode: builder.mutation({
      query: ({ modeId, ...data }) => ({
        url: `/allocation-modes/${modeId}`,
        method: "patch",
        data,
      }),
      invalidatesTags: [{ type: "Inventory", id: "ALLOCATION_MODE_LIST" }],
    }),

    deleteAllocationMode: builder.mutation({
      query: ({ modeId }) => ({
        url: `/allocation-modes/${modeId}`,
        method: "delete",
      }),
      invalidatesTags: [{ type: "Inventory", id: "ALLOCATION_MODE_LIST" }],
    }),

    getApplicableAllocationModes: builder.query({
      query: (params = {}) => ({
        url: "/allocation-modes/applicable",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: (result, error, arg) => [
        {
          type: "Inventory",
          id: `ALLOCATION_MODE_APPLICABLE-${arg?.militaryId || "none"}-${arg?.issueYear || "current"}`,
        },
      ],
    }),

    getAllocationModeEligibility: builder.query({
      query: ({ modeId, ...params }) => ({
        url: `/allocation-modes/${modeId}/eligibility`,
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: (result, error, arg) => [
        {
          type: "Inventory",
          id: `ALLOCATION_MODE_ELIGIBILITY-${arg?.modeId || "none"}-${arg?.militaryId || "none"}-${arg?.issueYear || "current"}-${arg?.warehouseId || "none"}`,
        },
      ],
    }),

    createAllocationModeIssueVoucher: builder.mutation({
      query: (data) => ({
        url: "/allocation-modes/issue-vouchers",
        method: "post",
        data,
      }),
      invalidatesTags: [
        { type: "Inventory", id: "ALLOCATION_MODE_ISSUE_VOUCHER_LIST" },
        { type: "Inventory", id: "ALLOCATION_MODE_LIST" },
      ],
    }),

    getAllocationModeIssueVouchers: builder.query({
      query: (params = {}) => ({
        url: "/allocation-modes/issue-vouchers",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Inventory", id: "ALLOCATION_MODE_ISSUE_VOUCHER_LIST" }],
    }),

    getAllocationModeIssueVoucherDetail: builder.query({
      query: ({ voucherId }) => ({
        url: `/allocation-modes/issue-vouchers/${voucherId}`,
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: (result, error, arg) => [
        { type: "Inventory", id: `ALLOCATION_MODE_ISSUE_VOUCHER-${arg?.voucherId || "none"}` },
      ],
    }),

    updateAllocationModeIssueVoucher: builder.mutation({
      query: ({ voucherId, ...data }) => ({
        url: `/allocation-modes/issue-vouchers/${voucherId}`,
        method: "patch",
        data,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      invalidatesTags: (result, error, arg) => [
        { type: "Inventory", id: "ALLOCATION_MODE_ISSUE_VOUCHER_LIST" },
        { type: "Inventory", id: `ALLOCATION_MODE_ISSUE_VOUCHER-${arg?.voucherId || "none"}` },
      ],
    }),

    deleteAllocationModeIssueVoucher: builder.mutation({
      query: ({ voucherId }) => ({
        url: `/allocation-modes/issue-vouchers/${voucherId}`,
        method: "delete",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      invalidatesTags: (result, error, arg) => [
        { type: "Inventory", id: "ALLOCATION_MODE_ISSUE_VOUCHER_LIST" },
        { type: "Inventory", id: `ALLOCATION_MODE_ISSUE_VOUCHER-${arg?.voucherId || "none"}` },
      ],
    }),

    downloadAllocationModeIssueVoucher: builder.mutation({
      query: ({ voucherId }) => ({
        url: `/allocation-modes/issue-vouchers/${voucherId}/file`,
        method: "get",
        responseType: "blob",
      }),
    }),

    getAllocationModeVoucherTemplate: builder.query({
      query: (params = {}) => ({
        url: "/allocation-modes/voucher-template",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: (result, error, arg) => [
        {
          type: "Inventory",
          id: `ALLOCATION_MODE_VOUCHER_TEMPLATE-${arg?.templateType || "default"}`,
        },
      ],
    }),

    saveAllocationModeVoucherTemplate: builder.mutation({
      query: (data) => ({
        url: "/allocation-modes/voucher-template",
        method: "put",
        data,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      invalidatesTags: (result, error, arg) => [
        {
          type: "Inventory",
          id: `ALLOCATION_MODE_VOUCHER_TEMPLATE-${arg?.templateType || "default"}`,
        },
        { type: "Inventory", id: "ALLOCATION_MODE_ISSUE_VOUCHER_LIST" },
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
  useGetAllocationServiceLifeRulesQuery,
  useCreateAllocationServiceLifeRuleMutation,
  useUpdateAllocationServiceLifeRuleMutation,
  useDeleteAllocationServiceLifeRuleMutation,
  useGetAllocationServiceLifeEditorQuery,
  useSaveAllocationServiceLifeEditorMutation,
  useGetAllocationIssueHistoryQuery,
  useGetInventoryItemsQuery,
  useGetAllocationModesQuery,
  useCreateAllocationModeMutation,
  useUpdateAllocationModeMutation,
  useDeleteAllocationModeMutation,
  useGetApplicableAllocationModesQuery,
  useGetAllocationModeEligibilityQuery,
  useCreateAllocationModeIssueVoucherMutation,
  useGetAllocationModeIssueVouchersQuery,
  useGetAllocationModeIssueVoucherDetailQuery,
  useUpdateAllocationModeIssueVoucherMutation,
  useDeleteAllocationModeIssueVoucherMutation,
  useDownloadAllocationModeIssueVoucherMutation,
  useGetAllocationModeVoucherTemplateQuery,
  useSaveAllocationModeVoucherTemplateMutation,
} = inventoryApi;
