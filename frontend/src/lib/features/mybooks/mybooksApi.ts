import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface EbookDto {
  bookId: string;
  title: string;
  slug: string;
  coverColor: string;
  coverEmoji: string;
  coverUrl: string | null;
  author: string | null;
  pageCount: number | null;
  fileSizeMb: number | null;
  sampleUrl: string | null;
  fileUrl: string | null;
  progressPct: number;
  lastReadAt: string | null;
  grantedAt: string;
  expiresAt: string | null;
  isExpired: boolean;
}

export const mybooksApi = createApi({
  reducerPath: "mybooksApi",
  baseQuery: withReauth(API_BASE),
  tagTypes: ["MyEbooks"],
  endpoints: (builder) => ({
    getMyEbooks: builder.query<EbookDto[], void>({
      query: () => ({
        url: "/api/v1/my-books/ebooks",
        headers: { "X-Tenant-Slug": "demo" },
      }),
      providesTags: ["MyEbooks"],
    }),
  }),
});

export const { useGetMyEbooksQuery } = mybooksApi;
