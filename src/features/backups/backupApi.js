import { baseApi } from "@/store/baseApi";

export const backupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBackupFiles: builder.query({
      query: ({ pageSize = 30, pageToken = "" } = {}) => ({
        url: "/backups",
        method: "get",
        params: {
          pageSize,
          ...(pageToken ? { pageToken } : {}),
        },
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Backup", id: "LIST" }],
    }),

    runBackupNow: builder.mutation({
      query: () => ({
        url: "/backups/run",
        method: "post",
        data: null,
      }),
      invalidatesTags: [{ type: "Backup", id: "LIST" }],
    }),

    restoreBackupFromDrive: builder.mutation({
      query: ({ fileId, fileName }) => ({
        url: "/backups/restore",
        method: "post",
        data: {
          fileId,
          fileName,
        },
      }),
      invalidatesTags: [{ type: "Backup", id: "LIST" }],
    }),
  }),
});

export const {
  useGetBackupFilesQuery,
  useRunBackupNowMutation,
  useRestoreBackupFromDriveMutation,
} = backupApi;
