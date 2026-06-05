"use client";

import { useAppSelector } from "../../lib/hooks";
import { selectIsAuthenticated } from "../../lib/features/auth/authSlice";
import { useGetMyEbooksQuery } from "../../lib/features/mybooks/mybooksApi";
import BookCover from "../../components/books/BookCover";
import BookSubNav from "../../components/books/BookSubNav";
import Link from "next/link";

export default function ThuVienSachPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data: ebooks, isLoading } = useGetMyEbooksQuery(undefined, {
    skip: !isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ background: "#f5f6fa" }}>
        <BookSubNav />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: "#0a2540" }}>
            Đăng nhập để xem thư viện sách
          </h1>
          <p className="text-gray-500 mb-8">
            Tất cả sách điện tử và tài liệu đã mua sẽ hiển thị tại đây.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-8 py-3 rounded-lg text-white font-semibold"
            style={{ background: "#e5173f" }}
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f5f6fa" }}>
      <BookSubNav />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0a2540" }}>
              Thư viện sách
            </h1>
            <p className="text-gray-500 mt-1">
              Sách điện tử đã mua và được kích hoạt
            </p>
          </div>
          <Link
            href="/kich-hoat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium text-sm transition-colors"
            style={{ borderColor: "#0a2540", color: "#0a2540" }}
          >
            🔑 Nhập mã kích hoạt
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg aspect-[3/4] mb-3" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : !ebooks || ebooks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">📖</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#0a2540" }}>
              Thư viện trống
            </h2>
            <p className="text-gray-500 mb-8">
              Bạn chưa có sách điện tử nào. Hãy khám phá và mua sách!
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/sach"
                className="px-6 py-3 rounded-lg text-white font-semibold"
                style={{ background: "#e5173f" }}
              >
                Khám phá sách
              </Link>
              <Link
                href="/kich-hoat"
                className="px-6 py-3 rounded-lg border-2 font-semibold"
                style={{ borderColor: "#0a2540", color: "#0a2540" }}
              >
                Nhập mã kích hoạt
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {ebooks.length} cuốn sách
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {ebooks.map((book) => (
                <EbookCard key={book.bookId} book={book} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EbookCard({
  book,
}: {
  book: import("../../lib/features/mybooks/mybooksApi").EbookDto;
}) {
  return (
    <div className="group">
      {/* Cover */}
      <Link href={`/sach/${book.slug}`}>
        <div className="relative rounded-lg overflow-hidden aspect-[3/4] shadow-md mb-3 cursor-pointer group-hover:shadow-xl transition-shadow">
          <BookCover
            title={book.title}
            author={book.author ?? undefined}
            coverColor={book.coverColor}
            coverEmoji={book.coverEmoji}
            coverUrl={book.coverUrl}
          />
          {/* Ebook badge */}
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            Ebook
          </div>
          {/* Progress bar */}
          {book.progressPct > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
              <div
                className="h-full bg-green-400 transition-all"
                style={{ width: `${book.progressPct}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div>
        <Link href={`/sach/${book.slug}`}>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1 hover:text-blue-700 transition-colors" style={{ color: "#0a2540" }}>
            {book.title}
          </h3>
        </Link>
        {book.author && (
          <p className="text-xs text-gray-500 mb-2 truncate">{book.author}</p>
        )}

        {/* Progress */}
        {book.progressPct > 0 && (
          <p className="text-xs text-green-600 font-medium mb-2">
            Đã đọc {book.progressPct}%
          </p>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-0.5">
          {book.pageCount && <p>{book.pageCount} trang</p>}
          {book.fileSizeMb && <p>{book.fileSizeMb.toFixed(1)} MB</p>}
        </div>

        {/* Download button */}
        {book.fileUrl ? (
          <a
            href={book.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold border-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: "#0a2540", color: "#0a2540" }}
          >
            ⬇ Tải xuống
          </a>
        ) : book.sampleUrl ? (
          <a
            href={book.sampleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold border-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: "#6b7280", color: "#6b7280" }}
          >
            👁 Xem trước
          </a>
        ) : null}
      </div>
    </div>
  );
}
