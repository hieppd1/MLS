"use client";

import { useState } from "react";
import {
  useListQuizTypesQuery,
  useCreateQuizTypeMutation,
  useUpdateQuizTypeMutation,
  useDeleteQuizTypeMutation,
  type QuizTypeConfigDto,
} from "@/lib/features/quiz/quizConfigApi";
import {
  QUESTION_TYPES,
  SKILL_TYPES,
  DIFFICULTIES,
  EXAM_MODES,
} from "@/lib/config/portalConfig";

const MLS_NAVY = "#1565C0";
const MLS_RED  = "#e5173f";

// ── Static category card ──────────────────────────────────────────────────────

function StaticCard({ icon, title, items, note }: {
  icon: string; title: string;
  items: { value: string; label: string }[]; note?: string;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h2>
          <span style={{ background: "#EFF6FF", color: MLS_NAVY, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{items.length}</span>
        </div>
        <span style={{ fontSize: 11, background: "#F3F4F6", color: "#9CA3AF", borderRadius: 6, padding: "3px 10px" }}>Cố định</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => (
          <div key={item.value} style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{item.label}</span>
            <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 6, fontFamily: "monospace" }}>{item.value}</span>
          </div>
        ))}
      </div>
      {note && <p style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF", margin: "12px 0 0" }}>ℹ️ {note}</p>}
    </div>
  );
}

// ── Quiz type row ─────────────────────────────────────────────────────────────

function QuizTypeRow({ item, onEdit, onDelete }: {
  item: QuizTypeConfigDto;
  onEdit: (item: QuizTypeConfigDto) => void;
  onDelete: (id: string) => void;
}) {
  const badges: Record<string, { bg: string; color: string }> = {
    Standard: { bg: "#EFF6FF", color: "#1D4ED8" },
    OPIC:     { bg: "#F0FDF4", color: "#15803D" },
    VSTEP:    { bg: "#FFF7ED", color: "#C2410C" },
  };
  const b = badges[item.examMode] ?? { bg: "#F3F4F6", color: "#374151" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6", fontSize: 12, color: "#6B7280", fontWeight: 700, flexShrink: 0 }}>
        {item.sortOrder}
      </span>
      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: b.bg, color: b.color, flexShrink: 0 }}>
        {item.examMode}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.label}</span>
        <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 8, fontFamily: "monospace" }}>{item.value}</span>
      </div>
      {!item.isActive && (
        <span style={{ fontSize: 11, background: "#FEF2F2", color: MLS_RED, borderRadius: 6, padding: "2px 8px", flexShrink: 0 }}>Ẩn</span>
      )}
      <button onClick={() => onEdit(item)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY, background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Sửa</button>
      <button onClick={() => onDelete(item.id)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${MLS_RED}`, color: MLS_RED, background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Xóa</button>
    </div>
  );
}

// ── Add/Edit modal ────────────────────────────────────────────────────────────

interface FormState { examMode: string; value: string; label: string; sortOrder: string; isActive: boolean }
const EMPTY: FormState = { examMode: "Standard", value: "", label: "", sortOrder: "0", isActive: true };

function QuizTypeModal({ initial, isEdit, onSave, onClose, saving, errorMsg }: {
  initial: FormState; isEdit: boolean;
  onSave: (f: FormState) => void; onClose: () => void;
  saving: boolean; errorMsg: string | null;
}) {
  const [f, setF] = useState<FormState>(initial);
  const set = (key: keyof FormState, val: string | boolean) =>
    setF((p) => ({ ...p, [key]: val }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440, maxWidth: "calc(100vw - 40px)", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: 20 }}>
          {isEdit ? "Sửa loại quiz" : "Thêm loại quiz mới"}
        </h3>
        {errorMsg && (
          <div style={{ background: "#FEF2F2", color: MLS_RED, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>{errorMsg}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Nền tảng</label>
            <select value={f.examMode} onChange={(e) => set("examMode", e.target.value)} disabled={isEdit}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: isEdit ? "#F9FAFB" : "#fff" }}>
              {EXAM_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Mã giá trị (Value) *</label>
            <input value={f.value} onChange={(e) => set("value", e.target.value)} disabled={isEdit}
              placeholder="Ví dụ: PracticeQuiz"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box", background: isEdit ? "#F9FAFB" : "#fff" }} />
            {isEdit && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9CA3AF" }}>Không thể thay đổi mã sau khi tạo</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Tên hiển thị (Label) *</label>
            <input value={f.label} onChange={(e) => set("label", e.target.value)}
              placeholder="Ví dụ: Luyện tập (Practice)"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Thứ tự hiển thị</label>
            <input value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} type="number" min="0"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          {isEdit && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#374151" }}>
              <input type="checkbox" checked={f.isActive} onChange={(e) => set("isActive", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: MLS_NAVY }} />
              Hiển thị trong danh sách
            </label>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
          <button onClick={() => onSave(f)} disabled={saving}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const MODE_TABS = ["Tất cả", "Standard", "OPIC", "VSTEP"] as const;
type ModeTab = typeof MODE_TABS[number];

export default function TeacherConfigPage() {
  const [activeTab, setActiveTab]     = useState<ModeTab>("Tất cả");
  const [modal, setModal]             = useState<FormState | null>(null);
  const [editId, setEditId]           = useState<string | null>(null);
  const [modalErr, setModalErr]       = useState<string | null>(null);
  const [confirmDel, setConfirmDel]   = useState<string | null>(null);

  const examModeParam = activeTab === "Tất cả" ? undefined : activeTab;
  const { data: quizTypes = [], isLoading } = useListQuizTypesQuery(
    { examMode: examModeParam, activeOnly: false },
    { refetchOnMountOrArgChange: true }
  );

  const [createQuizType, { isLoading: creating }] = useCreateQuizTypeMutation();
  const [updateQuizType, { isLoading: updating }] = useUpdateQuizTypeMutation();
  const [deleteQuizType] = useDeleteQuizTypeMutation();

  function openAdd()  { setEditId(null); setModal(EMPTY); setModalErr(null); }
  function openEdit(item: QuizTypeConfigDto) {
    setEditId(item.id);
    setModal({ examMode: item.examMode, value: item.value, label: item.label, sortOrder: String(item.sortOrder), isActive: item.isActive });
    setModalErr(null);
  }
  function closeModal() { setModal(null); setEditId(null); setModalErr(null); }

  async function handleSave(f: FormState) {
    if (!f.value.trim())  { setModalErr("Mã giá trị không được để trống"); return; }
    if (!f.label.trim())  { setModalErr("Tên hiển thị không được để trống"); return; }
    try {
      if (editId) {
        await updateQuizType({ id: editId, label: f.label, sortOrder: parseInt(f.sortOrder) || 0, isActive: f.isActive }).unwrap();
      } else {
        await createQuizType({ examMode: f.examMode, value: f.value.trim(), label: f.label.trim(), sortOrder: parseInt(f.sortOrder) || 0 }).unwrap();
      }
      closeModal();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      setModalErr(e?.data?.error ?? "Lưu thất bại. Vui lòng thử lại.");
    }
  }

  async function handleDelete(id: string) {
    try { await deleteQuizType(id).unwrap(); } catch { /* ignore */ }
    setConfirmDel(null);
  }

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>⚙️ Cấu hình danh mục</h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>
          Quản lý các danh mục của hệ thống. <strong>Loại Quiz</strong> được lưu database — có thể thêm / sửa / xóa trực tiếp.
        </p>
      </div>

      {/* ── Loại Quiz ─────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏷️</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Loại Quiz</h2>
            <span style={{ background: "#EFF6FF", color: MLS_NAVY, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
              {quizTypes.length}
            </span>
            <span style={{ fontSize: 11, background: "#DCFCE7", color: "#16A34A", borderRadius: 6, padding: "3px 10px", fontWeight: 600 }}>
              Lưu DB · API live
            </span>
          </div>
          <button onClick={openAdd}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            + Thêm loại
          </button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: "2px solid #E5E7EB" }}>
          {MODE_TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "7px 16px", borderRadius: "8px 8px 0 0", border: "none",
                background: "transparent",
                color: activeTab === tab ? MLS_NAVY : "#6B7280",
                cursor: "pointer", fontWeight: activeTab === tab ? 700 : 400, fontSize: 13,
                borderBottom: activeTab === tab ? `2px solid ${MLS_NAVY}` : "2px solid transparent",
                marginBottom: -2,
              }}>
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#9CA3AF" }}>Đang tải...</div>
        ) : quizTypes.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#9CA3AF" }}>Chưa có loại quiz nào. Nhấn &quot;Thêm loại&quot; để bắt đầu.</div>
        ) : (
          <div>
            {quizTypes.map((item) => (
              <QuizTypeRow key={item.id} item={item} onEdit={openEdit} onDelete={(id) => setConfirmDel(id)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Static categories ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <StaticCard icon="❓" title="Loại câu hỏi" items={QUESTION_TYPES}
          note="Dùng trong form tạo/sửa câu hỏi và bộ lọc ngân hàng câu hỏi." />
        <StaticCard icon="📖" title="Kỹ năng ngôn ngữ" items={SKILL_TYPES}
          note="Dùng trong form câu hỏi, form quiz, và bộ lọc danh sách." />
        <StaticCard icon="🎯" title="Độ khó" items={DIFFICULTIES}
          note="Dùng trong form câu hỏi và bộ lọc tìm kiếm." />
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modal && (
        <QuizTypeModal
          initial={modal} isEdit={!!editId}
          onSave={handleSave} onClose={closeModal}
          saving={creating || updating} errorMsg={modalErr}
        />
      )}

      {/* ── Delete confirm ─────────────────────────────────────────────────── */}
      {confirmDel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: 12 }}>Xóa loại quiz?</h3>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
              Thao tác này không thể hoàn tác. Các quiz đã tạo với loại này sẽ không bị ảnh hưởng.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDel(null)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
              <button onClick={() => handleDelete(confirmDel)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: MLS_RED, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
