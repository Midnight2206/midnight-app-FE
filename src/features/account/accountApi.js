import { baseApi } from "@/store/baseApi";

export const accountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query({
      query: (params = {}) => ({
        url: "/accounts",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Account", id: "LIST" }],
    }),

    getAccountUnits: builder.query({
      query: () => ({
        url: "/accounts/units",
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Unit", id: "LIST" }],
    }),

    getAccountAudits: builder.query({
      query: (params = {}) => ({
        url: "/accounts/audits",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Account", id: "AUDITS" }],
    }),

    createAdminAccount: builder.mutation({
      query: (data) => ({
        url: "/accounts/admins",
        method: "post",
        data,
      }),
      invalidatesTags: [
        { type: "Account", id: "LIST" },
        { type: "Account", id: "AUDITS" },
      ],
    }),

    updateAccountStatus: builder.mutation({
      query: ({ userId, isActive }) => ({
        url: `/accounts/${userId}/status`,
        method: "patch",
        data: { isActive },
      }),
      invalidatesTags: [
        { type: "Account", id: "LIST" },
        { type: "Account", id: "AUDITS" },
      ],
    }),

    resetAccountPassword: builder.mutation({
      query: ({ userId, newPassword }) => ({
        url: `/accounts/${userId}/reset-password`,
        method: "patch",
        data: { newPassword },
      }),
      invalidatesTags: [{ type: "Account", id: "AUDITS" }],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountUnitsQuery,
  useGetAccountAuditsQuery,
  useCreateAdminAccountMutation,
  useUpdateAccountStatusMutation,
  useResetAccountPasswordMutation,
} = accountApi;
