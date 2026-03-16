import { baseApi } from "@/store/baseApi";

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategoryCatalogOptions: builder.query({
      query: () => ({
        url: "/categories/catalog-options",
        method: "get",
      }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: "Category", id: "CATALOG_OPTIONS" }],
    }),

    getCategories: builder.query({
      query: (params = {}) => ({
        url: "/categories",
        method: "get",
        params,
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, arg) => [
        { type: "Category", id: "LIST" },
        { type: "Category", id: `LIST-${arg?.status ?? "active"}` },
      ],
    }),

    getCategoryById: builder.query({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "get",
      }),
      transformResponse: (response) => response,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),

    createCategory: builder.mutation({
      query: (data) => ({
        url: "/categories",
        method: "post",
        data,
      }),
      // Chỉ cần refresh list, không cần đụng tới các item đang cache
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    updateCategory: builder.mutation({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: "patch",
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "delete",
        data: null,
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),

    restoreCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}/restore`,
        method: "post",
        data: null,
      }),
      // Restore làm item chuyển giữa các filter → invalidate tất cả LIST
      invalidatesTags: (result, error, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
        { type: "Category", id: "LIST-true" },
        { type: "Category", id: "LIST-false" },
      ],
    }),

    getVersions: builder.query({
      query: (params = {}) => ({
        url: "/categories/versions",
        method: "get",
        params,
      }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: "Category", id: "VERSION_LIST" }],
    }),

    createVersion: builder.mutation({
      query: (data) => ({
        url: "/categories/versions",
        method: "post",
        data,
      }),
      invalidatesTags: [
        { type: "Category", id: "VERSION_LIST" },
        { type: "Category", id: "CATALOG_OPTIONS" },
      ],
    }),

    deleteVersion: builder.mutation({
      query: (versionId) => ({
        url: `/categories/versions/${versionId}`,
        method: "delete",
      }),
      invalidatesTags: [
        { type: "Category", id: "VERSION_LIST" },
        { type: "Category", id: "CATALOG_OPTIONS" },
      ],
    }),

    getColors: builder.query({
      query: (params = {}) => ({
        url: "/categories/colors",
        method: "get",
        params,
      }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: "Category", id: "COLOR_LIST" }],
    }),

    createColor: builder.mutation({
      query: (data) => ({
        url: "/categories/colors",
        method: "post",
        data,
      }),
      invalidatesTags: [
        { type: "Category", id: "COLOR_LIST" },
        { type: "Category", id: "CATALOG_OPTIONS" },
      ],
    }),

    deleteColor: builder.mutation({
      query: (colorId) => ({
        url: `/categories/colors/${colorId}`,
        method: "delete",
      }),
      invalidatesTags: [
        { type: "Category", id: "COLOR_LIST" },
        { type: "Category", id: "CATALOG_OPTIONS" },
      ],
    }),
  }),
});

export const {
  useGetCategoryCatalogOptionsQuery,
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useLazyGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useRestoreCategoryMutation,
  useGetVersionsQuery,
  useCreateVersionMutation,
  useDeleteVersionMutation,
  useGetColorsQuery,
  useCreateColorMutation,
  useDeleteColorMutation,
} = categoryApi;
