import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminBookListItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  price: number;
  discountPrice: number | null;
  author: string | null;
  coverColor: string;
  coverEmoji: string;
  coverUrl: string | null;
  categoryName: string | null;
  isFeatured: boolean;
  purchaseCount: number;
  createdAt: string;
}

export interface AdminBookDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  coverColor: string;
  coverEmoji: string;
  coverUrl: string | null;
  type: string;
  status: string;
  level: string | null;
  tags: string | null;
  price: number;
  discountPrice: number | null;
  discountEndsAt: string | null;
  pageCount: number | null;
  fileUrl: string | null;
  fileSizeMb: number | null;
  sampleUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
  categoryId: string | null;
  categoryName: string | null;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminBookListResult {
  items: AdminBookListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetAdminBooksParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
  categoryId?: string;
}

export interface BookUpsertPayload {
  title: string;
  type: string;
  price: number;
  description?: string | null;
  shortDescription?: string | null;
  author?: string | null;
  publisher?: string | null;
  isbn?: string | null;
  coverColor?: string;
  coverEmoji?: string;
  coverUrl?: string | null;
  categoryId?: string | null;
  level?: string | null;
  tags?: string | null;
  discountPrice?: number | null;
  discountEndsAt?: string | null;
  pageCount?: number | null;
  fileUrl?: string | null;
  fileSizeMb?: number | null;
  sampleUrl?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface BookTranslationDto {
  locale: string;
  title: string | null;
  shortDescription: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpsertBookTranslationPayload {
  id: string;
  locale: string;
  title?: string | null;
  shortDescription?: string | null;
  description?: string | null;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const adminBooksApi = createApi({
  reducerPath: "adminBooksApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/admin/books`),
  tagTypes: ["AdminBooks", "BookTranslations"],
  endpoints: (builder) => ({
    getAdminBooks: builder.query<AdminBookListResult, GetAdminBooksParams>({
      query: (params) => ({
        url: "",
        params: { page: 1, pageSize: 20, ...params },
      }),
      providesTags: ["AdminBooks"],
    }),
    getAdminBookDetail: builder.query<AdminBookDetail, string>({
      query: (id) => `/${id}`,
      providesTags: (_res, _err, id) => [{ type: "AdminBooks", id }],
    }),
    createBook: builder.mutation<{ id: string }, BookUpsertPayload>({
      query: (body) => ({ url: "", method: "POST", body }),
      invalidatesTags: ["AdminBooks"],
    }),
    updateBook: builder.mutation<void, { id: string } & BookUpsertPayload>({
      query: ({ id, ...body }) => ({ url: `/${id}`, method: "PUT", body }),
      invalidatesTags: (_res, _err, { id }) => ["AdminBooks", { type: "AdminBooks", id }],
    }),
    deleteBook: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminBooks"],
    }),
    publishBook: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}/publish`, method: "POST" }),
      invalidatesTags: (_res, _err, id) => ["AdminBooks", { type: "AdminBooks", id }],
    }),
    unpublishBook: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}/unpublish`, method: "POST" }),
      invalidatesTags: (_res, _err, id) => ["AdminBooks", { type: "AdminBooks", id }],
    }),
    getBookTranslations: builder.query<BookTranslationDto[], string>({
      query: (id) => `/${id}/translations`,
      providesTags: (_res, _err, id) => [{ type: "BookTranslations", id }],
    }),
    upsertBookTranslation: builder.mutation<void, UpsertBookTranslationPayload>({
      query: ({ id, locale, ...body }) => ({
        url: `/${id}/translations/${locale}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: "BookTranslations", id }],
    }),
  }),
});

export const {
  useGetAdminBooksQuery,
  useGetAdminBookDetailQuery,
  useCreateBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
  usePublishBookMutation,
  useUnpublishBookMutation,
  useGetBookTranslationsQuery,
  useUpsertBookTranslationMutation,
} = adminBooksApi;
