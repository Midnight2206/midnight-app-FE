import { baseApi } from "@/store/baseApi";

export const sizeRegistrationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyRegistrationContext: builder.query({
      query: (params = {}) => ({
        url: "/size-registrations/my/context",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
    }),

    submitMyRegistrationRequest: builder.mutation({
      query: (data) => ({
        url: "/size-registrations/my/requests",
        method: "post",
        data,
      }),
    }),

    getRegistrationPeriods: builder.query({
      query: () => ({
        url: "/size-registrations/periods",
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Military", id: "REG_PERIODS" }],
    }),

    upsertRegistrationPeriod: builder.mutation({
      query: ({ year, status, note }) => ({
        url: `/size-registrations/periods/${year}`,
        method: "put",
        data: { status, note },
      }),
      invalidatesTags: [{ type: "Military", id: "REG_PERIODS" }],
    }),

    getRegistrationRequests: builder.query({
      query: (params = {}) => ({
        url: "/size-registrations/requests",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
    }),

    reviewRegistrationRequest: builder.mutation({
      query: ({ requestId, action, reviewNote }) => ({
        url: `/size-registrations/requests/${requestId}/review`,
        method: "patch",
        data: { action, reviewNote },
      }),
    }),
  }),
});

export const {
  useGetMyRegistrationContextQuery,
  useSubmitMyRegistrationRequestMutation,
  useGetRegistrationPeriodsQuery,
  useUpsertRegistrationPeriodMutation,
  useGetRegistrationRequestsQuery,
  useReviewRegistrationRequestMutation,
} = sizeRegistrationApi;
