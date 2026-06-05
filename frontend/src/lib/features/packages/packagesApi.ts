import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PackageEntitlementDto {
  id: string;
  featureCode: string;
  enabled: boolean;
}

export interface PackageDto {
  id: string;
  courseId: string;
  packageType: "Basic" | "Standard" | "Advance";
  title: string;
  description: string | null;
  originalPrice: number;
  salePrice: number;
  durationDay: number;
  status: string;
  entitlements: PackageEntitlementDto[];
}

export interface StudentPackageDto {
  id: string;
  packageId: string;
  packageType: string;
  packageTitle: string;
  courseId: string;
  startDate: string;
  expiredDate: string | null;
  status: string;
  featureCodes: string[];
}

export interface FeatureAccessDto {
  hasAccess: boolean;
  packageType: string | null;
  expiresAt: string | null;
}

// ── API Slice ─────────────────────────────────────────────────────────────────

export const packagesApi = createApi({
  reducerPath: "packagesApi",
  baseQuery: withReauth(`${API_BASE}/api/v1`),
  tagTypes: ["Package", "StudentPackage"],
  endpoints: (builder) => ({
    getCoursePackages: builder.query<PackageDto[], string>({
      query: (courseId) => `/courses/${courseId}/packages`,
      providesTags: (_r, _e, courseId) => [{ type: "Package", id: courseId }],
    }),

    getMyPackages: builder.query<StudentPackageDto[], string | undefined>({
      query: (courseId) => {
        const params = courseId ? `?courseId=${courseId}` : "";
        return `/my-packages${params}`;
      },
      providesTags: ["StudentPackage"],
    }),

    checkFeatureAccess: builder.query<
      FeatureAccessDto,
      { courseId: string; featureCode: string }
    >({
      query: ({ courseId, featureCode }) =>
        `/courses/${courseId}/packages/access/${featureCode}`,
      providesTags: ["StudentPackage"],
    }),

    purchasePackage: builder.mutation<
      StudentPackageDto,
      { courseId: string; packageId: string }
    >({
      query: ({ courseId, packageId }) => ({
        url: `/courses/${courseId}/packages/${packageId}/purchase`,
        method: "POST",
      }),
      invalidatesTags: ["StudentPackage"],
    }),

    // ── Admin endpoints ───────────────────────────────────────────────────────

    adminGetCoursePackages: builder.query<PackageDto[], string>({
      query: (courseId) => `/admin/packages/courses/${courseId}`,
      providesTags: (_r, _e, courseId) => [{ type: "Package", id: `admin-${courseId}` }],
    }),

    adminCreatePackage: builder.mutation<PackageDto, AdminCreatePackageInput>({
      query: (body) => ({ url: `/admin/packages`, method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Package", id: `admin-${arg.courseId}` }],
    }),

    adminUpdatePackage: builder.mutation<PackageDto, { packageId: string } & AdminUpdatePackageInput>({
      query: ({ packageId, ...body }) => ({
        url: `/admin/packages/${packageId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Package", id: `admin-${arg.courseId}` }],
    }),

    adminActivatePackage: builder.mutation<void, { packageId: string; courseId: string }>({
      query: ({ packageId }) => ({ url: `/admin/packages/${packageId}/activate`, method: "POST" }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Package", id: `admin-${arg.courseId}` }],
    }),

    adminArchivePackage: builder.mutation<void, { packageId: string; courseId: string }>({
      query: ({ packageId }) => ({ url: `/admin/packages/${packageId}/archive`, method: "POST" }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Package", id: `admin-${arg.courseId}` }],
    }),
  }),
});

// ── Admin input types ─────────────────────────────────────────────────────────

export interface EntitlementInput {
  featureCode: string;
  enabled: boolean;
}

export interface AdminCreatePackageInput {
  courseId: string;
  packageType: string;
  title: string;
  description: string | null;
  originalPrice: number;
  salePrice: number;
  durationDay: number;
  entitlements: EntitlementInput[];
}

export interface AdminUpdatePackageInput {
  courseId: string; // used for cache invalidation only
  title: string;
  description: string | null;
  originalPrice: number;
  salePrice: number;
  durationDay: number;
  entitlements: EntitlementInput[];
}

export const {
  useGetCoursePackagesQuery,
  useGetMyPackagesQuery,
  useCheckFeatureAccessQuery,
  usePurchasePackageMutation,
  useAdminGetCoursePackagesQuery,
  useAdminCreatePackageMutation,
  useAdminUpdatePackageMutation,
  useAdminActivatePackageMutation,
  useAdminArchivePackageMutation,
} = packagesApi;
