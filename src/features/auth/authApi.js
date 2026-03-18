import { baseApi } from "@/store/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query({
      query: () => ({
        url: "/auth/me",
        method: "get",
      }),
      transformResponse: (response) => response,
      providesTags: ["User"],
    }),

    getMyProfile: builder.query({
      query: () => ({
        url: "/auth/profile",
        method: "get",
      }),
      transformResponse: (response) => response,
      providesTags: ["User"],
    }),

    updateMyProfile: builder.mutation({
      query: (data) => ({
        url: "/auth/profile",
        method: "patch",
        data,
      }),
      invalidatesTags: ["User"],
    }),

    getMySessions: builder.query({
      query: () => ({
        url: "/auth/sessions",
        method: "get",
      }),
      transformResponse: (response) => response,
      providesTags: ["User"],
    }),

    getPasswordChangeStatus: builder.query({
      query: () => ({
        url: "/auth/password-change/status",
        method: "get",
      }),
      transformResponse: (response) => response,
      providesTags: ["User"],
    }),

    requestPasswordChange: builder.mutation({
      query: (data) => ({
        url: "/auth/password-change/request",
        method: "post",
        data,
      }),
      invalidatesTags: ["User"],
    }),

    confirmPasswordChange: builder.mutation({
      query: ({ token }) => ({
        url: "/auth/password-change/confirm",
        method: "post",
        data: { token },
        skipRefresh: true,
      }),
    }),

    register: builder.mutation({
      query: (data) => ({
        url: "/auth/register",
        method: "post",
        data,
      }),
    }),

    login: builder.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: "post",
        data,
      skipRefresh: true,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "post",
        data: null,
      }),
    }),

    requestVerifyEmail: builder.mutation({
      query: () => ({
        url: "/auth/verify-email/request",
        method: "post",
        data: null,
      }),
    }),

    confirmVerifyEmail: builder.mutation({
      query: ({ token }) => ({
        url: "/auth/verify-email/confirm",
        method: "get",
        params: { token },
        skipRefresh: true,
      }),
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetMySessionsQuery,
  useGetPasswordChangeStatusQuery,
  useRequestPasswordChangeMutation,
  useConfirmPasswordChangeMutation,
  useLazyGetCurrentUserQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRequestVerifyEmailMutation,
  useConfirmVerifyEmailMutation,
} = authApi;
