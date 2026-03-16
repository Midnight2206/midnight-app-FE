import { baseApi } from "@/store/baseApi";

export const accessApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccessRoles: builder.query({
      query: () => ({
        url: "/access/roles",
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Access", id: "ROLES" }],
    }),

    getAccessPermissions: builder.query({
      query: () => ({
        url: "/access/permissions",
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Access", id: "PERMISSIONS" }],
    }),

    getAccessUsers: builder.query({
      query: () => ({
        url: "/access/users",
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Access", id: "USERS" }],
    }),

    syncAccessPermissions: builder.mutation({
      query: () => ({
        url: "/access/permissions/sync",
        method: "post",
      }),
      invalidatesTags: [
        { type: "Access", id: "PERMISSIONS" },
        { type: "Access", id: "ROLES" },
      ],
    }),

    createAccessRole: builder.mutation({
      query: (data) => ({
        url: "/access/roles",
        method: "post",
        data,
      }),
      invalidatesTags: [{ type: "Access", id: "ROLES" }],
    }),

    updateRolePermissions: builder.mutation({
      query: ({ roleId, permissionCodes }) => ({
        url: `/access/roles/${roleId}/permissions`,
        method: "patch",
        data: { permissionCodes },
      }),
      invalidatesTags: [{ type: "Access", id: "ROLES" }],
    }),

    updateUserRole: builder.mutation({
      query: ({ userId, roleName }) => ({
        url: `/access/users/${userId}/role`,
        method: "patch",
        data: { roleName },
      }),
      invalidatesTags: [
        { type: "Access", id: "USERS" },
        { type: "Access", id: "ROLES" },
      ],
    }),
  }),
});

export const {
  useGetAccessRolesQuery,
  useGetAccessPermissionsQuery,
  useGetAccessUsersQuery,
  useSyncAccessPermissionsMutation,
  useCreateAccessRoleMutation,
  useUpdateRolePermissionsMutation,
  useUpdateUserRoleMutation,
} = accessApi;
