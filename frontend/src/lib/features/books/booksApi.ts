import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BookCategory {
  id: string;
  name: string;
  slug: string;
  bookCount: number;
}

export interface BookListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  author: string | null;
  coverColor: string;
  coverEmoji: string;
  coverUrl: string | null;
  type: "Ebook" | "Physical" | "Combo";
  level: string | null;
  price: number;
  discountPrice: number | null;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  categoryId: string | null;
  categoryName: string | null;
  isFeatured: boolean;
}

export interface BookDetail extends BookListItem {
  description: string | null;
  publisher: string | null;
  isbn: string | null;
  tags: string | null;
  discountEndsAt: string | null;
  pageCount: number | null;
  fileSizeMb: number | null;
  sampleUrl: string | null;
  isOwned: boolean;
  createdAt: string;
}

export interface BooksResult {
  items: BookListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BooksQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
}

// ── API Slice ─────────────────────────────────────────────────────────────────

export const booksApi = createApi({
  reducerPath: "booksApi",
  baseQuery: withReauth(API_BASE),
  tagTypes: ["Book", "BookCategory"],
  endpoints: (builder) => ({
    getBooks: builder.query<BooksResult, BooksQueryParams>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params.page)       qs.set("page", String(params.page));
        if (params.pageSize)   qs.set("pageSize", String(params.pageSize));
        if (params.search)     qs.set("search", params.search);
        if (params.categoryId) qs.set("categoryId", params.categoryId);
        if (params.type)       qs.set("type", params.type);
        if (params.minPrice != null) qs.set("minPrice", String(params.minPrice));
        if (params.maxPrice != null) qs.set("maxPrice", String(params.maxPrice));
        if (params.minRating != null) qs.set("minRating", String(params.minRating));
        if (params.sort)       qs.set("sort", params.sort);
        return `/api/v1/books?${qs.toString()}`;
      },
      providesTags: ["Book"],
    }),

    getBookCategories: builder.query<BookCategory[], void>({
      query: () => "/api/v1/books/categories",
      providesTags: ["BookCategory"],
    }),

    getBookBySlug: builder.query<BookDetail, string>({
      query: (slug) => `/api/v1/books/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Book", id: slug }],
    }),
  }),
});

export const {
  useGetBooksQuery,
  useGetBookCategoriesQuery,
  useGetBookBySlugQuery,
} = booksApi;
