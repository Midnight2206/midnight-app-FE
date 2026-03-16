import { baseApi } from "@/store/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query({
      query: () => ({
        url: "/auth/me",
        method: "get",
      }),
      transformResponse: (response) => response,
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
  useLazyGetCurrentUserQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRequestVerifyEmailMutation,
  useConfirmVerifyEmailMutation,
} = authApi;
