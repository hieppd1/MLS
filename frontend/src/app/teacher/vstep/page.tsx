"use client";

import Link from "next/link";
import { useGetPublishedQuizzesQuery } from "@/lib/features/quiz/vstepApi";

const MLS_NAVY = "#1565C0";

export default function TeacherVSTEPPage() {
  const { data: publishedQuizzes = [], isLoading } = useGetPublishedQuizzesQuery("VSTEPMockTest");

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Tổng quan VSTEP</h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "6px 0 0" }}>
          Quản lý bài thi VSTEP — Nghe (35 MCQ) · Đọc (40 MCQ) · Viết (2 tasks) · Nói (3 phần)
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Bài thi đã xuất bản", value: publishedQuizzes.length, color: MLS_NAVY, icon: "📋" },
          { label: "Thang điểm", value: "0–10", color: "#059669", icon: "📊" },
          { label: "Band tối đa", value: "C1", color: "#7C3AED", icon: "🏅" },
          { label: "Tổng thời gian", value: "172 phút", color: "#D97706", icon: "⏱" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Band table */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: 16 }}>Thang điểm VSTEP</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Band", "Điểm trung bình", "Điểm tối thiểu mỗi kỹ năng", "Mô tả"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { band: "C1", avg: "≥ 8.0", min: "≥ 6.0", desc: "Sử dụng tiếng Anh thành thạo", color: "#7C3AED", bg: "#F5F3FF" },
                { band: "B2", avg: "≥ 6.0", min: "≥ 4.0", desc: "Sử dụng tiếng Anh độc lập", color: "#1D4ED8", bg: "#EFF6FF" },
                { band: "B1", avg: "≥ 4.0", min: "—",     desc: "Giao tiếp cơ bản tốt",        color: "#059669", bg: "#F0FDF4" },
                { band: "A2", avg: "≥ 2.5", min: "—",     desc: "Giao tiếp đơn giản",           color: "#D97706", bg: "#FFFBEB" },
              ].map(({ band, avg, min, desc, color, bg }) => (
                <tr key={band} style={{ background: bg }}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color }}>{band}</span>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color }}>{avg}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E5E7EB", color: "#374151" }}>{min}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E5E7EB", color: "#374151" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Published quizzes */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Bài thi VSTEP đã xuất bản</h2>
          <Link href="/teacher/quizzes/new"
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
            + Tạo bài thi mới
          </Link>
        </div>

        {isLoading && <div style={{ color: "#9CA3AF", padding: "16px 0" }}>Đang tải...</div>}

        {!isLoading && publishedQuizzes.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 600 }}>Chưa có bài thi VSTEP nào</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Tạo bài thi mới để bắt đầu</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {publishedQuizzes.map((q) => (
            <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderRadius: 10, border: "1px solid #E5E7EB", background: "#FAFAFA" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{q.title}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  {q.quizType} · {q.timeLimitSeconds ? `${Math.round(q.timeLimitSeconds / 60)} phút` : "Không giới hạn"}
                </div>
              </div>
              <Link href={`/teacher/quizzes/${q.id}`}
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY,
                  textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                Chi tiết
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 24 }}>
        {[
          { href: "/teacher/vstep/sessions", label: "Phiên thi học viên", desc: "Xem lịch sử thi của học viên", icon: "📋" },
          { href: "/teacher/quizzes", label: "Quản lý tất cả Quiz", desc: "Thêm câu hỏi, cấu hình bài thi", icon: "📝" },
        ].map(({ href, label, desc, icon }) => (
          <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 14,
            padding: "16px 18px", borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff",
            textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 26 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{label}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
