import { baseApi } from "@/store/baseApi";

export const militaryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMilitaries: builder.query({
      query: (params = {}) => ({
        url: "/militaries",
        method: "get",
        params,
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Military", id: "LIST" }],
    }),

    getMilitaryUnits: builder.query({
      query: (scope = "default") => ({
        url: "/militaries/units",
        method: "get",
        params: { scope },
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Unit", id: "MILITARY_UNITS" }],
    }),

    getMilitaryTypes: builder.query({
      query: () => ({
        url: "/militaries/types",
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Military", id: "TYPE_CATALOG" }],
    }),

    createMilitaryType: builder.mutation({
      query: (data) => ({
        url: "/militaries/types",
        method: "post",
        data,
      }),
      invalidatesTags: [{ type: "Military", id: "TYPE_CATALOG" }],
    }),

    deleteMilitaryType: builder.mutation({
      query: ({ typeId }) => ({
        url: `/militaries/types/${typeId}`,
        method: "delete",
      }),
      invalidatesTags: [{ type: "Military", id: "TYPE_CATALOG" }],
    }),

    getMilitaryRegistrationOptions: builder.query({
      query: () => ({
        url: "/militaries/registration-options",
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Military", id: "REGISTRATION_OPTIONS" }],
    }),

    getMilitaryRegistrationYears: builder.query({
      query: () => ({
        url: "/militaries/registration-years",
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Military", id: "REGISTRATION_YEARS" }],
    }),

    createMilitaryRegistrationYear: builder.mutation({
      query: (data) => ({
        url: "/militaries/registration-years",
        method: "post",
        data,
      }),
      invalidatesTags: [{ type: "Military", id: "REGISTRATION_YEARS" }],
    }),

    getMilitaryRegistrations: builder.query({
      query: ({ militaryId, year }) => ({
        url: `/militaries/${militaryId}/registrations`,
        method: "get",
        params: {
          year,
        },
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: (result, error, { militaryId }) => [
        { type: "Military", id: `REGISTRATION_${militaryId}` },
      ],
    }),

    updateMilitaryRegistrations: builder.mutation({
      query: ({ militaryId, registrations, year }) => ({
        url: `/militaries/${militaryId}/registrations`,
        method: "put",
        data: { registrations },
        params: {
          year,
        },
      }),
      invalidatesTags: (result, error, { militaryId }) => [
        { type: "Military", id: `REGISTRATION_${militaryId}` },
        { type: "Military", id: "LIST" },
      ],
    }),

    cutMilitaryAssurance: builder.mutation({
      query: ({ militaryId, transferOutYear }) => ({
        url: `/militaries/${militaryId}/transfers/cut`,
        method: "post",
        data: {
          transferOutYear,
        },
      }),
      invalidatesTags: [{ type: "Military", id: "LIST" }],
    }),

    receiveMilitaryAssurance: builder.mutation({
      query: ({ militaryCode, transferInYear }) => ({
        url: "/militaries/transfers/receive",
        method: "post",
        data: {
          militaryCode,
          transferInYear,
        },
      }),
      invalidatesTags: [{ type: "Military", id: "LIST" }],
    }),

    transferMilitaryAssurance: builder.mutation({
      query: (data) => ({
        url: "/militaries/transfers",
        method: "post",
        data,
      }),
      invalidatesTags: [{ type: "Military", id: "LIST" }],
    }),

    createCutTransferRequest: builder.mutation({
      query: ({ militaryId, ...data }) => ({
        url: `/militaries/${militaryId}/transfers/cut-request`,
        method: "post",
        data,
      }),
      invalidatesTags: [{ type: "Military", id: "LIST" }],
    }),

    getIncomingTransferRequests: builder.query({
      query: () => ({
        url: "/militaries/transfers/incoming",
        method: "get",
      }),
      transformResponse: (response) => response?.data ?? response ?? {},
      providesTags: [{ type: "Military", id: "TRANSFER_INCOMING" }],
    }),

    acceptTransferRequest: builder.mutation({
      query: ({ requestId }) => ({
        url: `/militaries/transfers/${requestId}/accept`,
        method: "post",
      }),
      invalidatesTags: [
        { type: "Military", id: "LIST" },
        { type: "Military", id: "TRANSFER_INCOMING" },
      ],
    }),

    undoCutTransferRequest: builder.mutation({
      query: ({ requestId }) => ({
        url: `/militaries/transfers/${requestId}/undo-cut`,
        method: "post",
      }),
      invalidatesTags: [
        { type: "Military", id: "LIST" },
        { type: "Military", id: "TRANSFER_INCOMING" },
      ],
    }),

    downloadRegistrationTemplate: builder.mutation({
      query: (params = {}) => ({
        url: "/militaries/registrations/template",
        method: "get",
        params,
        responseType: "blob",
      }),
    }),

    importMilitaryRegistrations: builder.mutation({
      query: (formData) => ({
        url: "/militaries/registrations/import",
        method: "post",
        data: formData,
      }),
      invalidatesTags: [{ type: "Military", id: "LIST" }],
    }),

    previewMilitaryRegistrationsImport: builder.mutation({
      query: (formData) => ({
        url: "/militaries/registrations/import-preview",
        method: "post",
        data: formData,
      }),
    }),

    createMilitaryUnit: builder.mutation({
      query: (data) => ({
        url: "/militaries/units",
        method: "post",
        data,
      }),
      invalidatesTags: [{ type: "Unit", id: "MILITARY_UNITS" }],
    }),

    downloadMilitaryTemplate: builder.mutation({
      query: (params = {}) => ({
        url: "/militaries/template",
        method: "get",
        params,
        responseType: "blob",
      }),
    }),

    importMilitaries: builder.mutation({
      query: (formData) => ({
        url: "/militaries/import",
        method: "post",
        data: formData,
      }),
      invalidatesTags: [{ type: "Military", id: "LIST" }],
    }),

    resetMilitaries: builder.mutation({
      query: (params = {}) => ({
        url: "/militaries/reset",
        method: "delete",
        params,
      }),
      invalidatesTags: [{ type: "Military", id: "LIST" }],
    }),
  }),
});

export const {
  useGetMilitariesQuery,
  useGetMilitaryUnitsQuery,
  useGetMilitaryTypesQuery,
  useCreateMilitaryTypeMutation,
  useDeleteMilitaryTypeMutation,
  useGetMilitaryRegistrationOptionsQuery,
  useGetMilitaryRegistrationYearsQuery,
  useCreateMilitaryRegistrationYearMutation,
  useGetMilitaryRegistrationsQuery,
  useUpdateMilitaryRegistrationsMutation,
  useCutMilitaryAssuranceMutation,
  useReceiveMilitaryAssuranceMutation,
  useTransferMilitaryAssuranceMutation,
  useCreateCutTransferRequestMutation,
  useGetIncomingTransferRequestsQuery,
  useAcceptTransferRequestMutation,
  useUndoCutTransferRequestMutation,
  useDownloadRegistrationTemplateMutation,
  useImportMilitaryRegistrationsMutation,
  usePreviewMilitaryRegistrationsImportMutation,
  useCreateMilitaryUnitMutation,
  useDownloadMilitaryTemplateMutation,
  useImportMilitariesMutation,
  useResetMilitariesMutation,
} = militaryApi;
