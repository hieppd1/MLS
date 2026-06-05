import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface InvoiceDto {
  id: string;
  orderId: string;
  invoiceNumber: string;
  issuedAt: string;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  buyerAddress: string | null;
  buyerTaxCode: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  vatAmount: number;
  notes: string | null;
  pdfUrl: string | null;
}

export const invoiceApi = createApi({
  reducerPath: "invoiceApi",
  baseQuery: withReauth(API_BASE),
  tagTypes: ["Invoice"],
  endpoints: (builder) => ({
    getOrCreateInvoice: builder.query<InvoiceDto, string>({
      query: (orderId) => `/api/v1/orders/${orderId}/invoice`,
      providesTags: (_result, _err, orderId) => [{ type: "Invoice", id: orderId }],
    }),
    getAdminInvoice: builder.query<InvoiceDto, string>({
      query: (orderId) => `/api/v1/admin/orders/${orderId}/invoice`,
      providesTags: (_result, _err, orderId) => [{ type: "Invoice", id: orderId }],
    }),
  }),
});

export const { useGetOrCreateInvoiceQuery, useGetAdminInvoiceQuery } = invoiceApi;

/** Returns the direct PDF download URL for a given order */
export function getInvoicePdfUrl(apiBase: string, orderId: string, isAdmin = false): string {
  if (isAdmin) return `${apiBase}/api/v1/admin/orders/${orderId}/invoice/pdf`;
  return `${apiBase}/api/v1/orders/${orderId}/invoice/pdf`;
}
