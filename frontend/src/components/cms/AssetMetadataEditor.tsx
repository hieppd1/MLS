"use client";

/**
 * AssetMetadataEditor — GUI form thay thế textarea JSON cho từng loại asset.
 * Serialize/deserialize JSON tự động. Backend không thay đổi.
 *
 * Supported types:
 *   GrammarBlock | VocabularyBlock | QuizBlock | ExerciseBlock | NoteBlock
 *   PPTBlock / FileAttachment → metadata tự sinh từ upload, không cần form.
 */

import { useEffect, useState, useCallback, useRef } from "react";

// ── Type definitions ──────────────────────────────────────────────────────────

interface GrammarExample { vi: string; en: string; }
interface GrammarMeta { pattern: string; examples: GrammarExample[]; keywords: string[]; }

interface VocabWord { word: string; ipa: string; meaning: string; audioUrl: string; example: string; exampleTranslation: string; }
interface VocabMeta { words: VocabWord[]; }

type QuizQuestionType = "multiple_choice" | "fill_in_blank";
interface QuizQuestion { text: string; type: QuizQuestionType; options: string[]; correctIndex: number; explanation: string; }
interface QuizMeta { questions: QuizQuestion[]; passScore: number; timeLimit: number; }

type ExerciseType = "fill_in_blank" | "matching" | "drag_drop";
interface ExerciseItem { sentence: string; answer: string; }
interface ExerciseMeta { type: ExerciseType; items: ExerciseItem[]; }

interface NoteMeta { authorType: "teacher" | "student"; content: string; }

// ── Default factories ─────────────────────────────────────────────────────────

const defaultGrammar = (): GrammarMeta => ({ pattern: "", examples: [{ vi: "", en: "" }], keywords: [] });
const defaultVocab = (): VocabMeta => ({ words: [{ word: "", ipa: "", meaning: "", audioUrl: "", example: "", exampleTranslation: "" }] });
const defaultQuiz = (): QuizMeta => ({ questions: [{ text: "", type: "multiple_choice", options: ["", "", "", ""], correctIndex: 0, explanation: "" }], passScore: 70, timeLimit: 120 });
const defaultExercise = (): ExerciseMeta => ({ type: "fill_in_blank", items: [{ sentence: "", answer: "" }] });
const defaultNote = (): NoteMeta => ({ authorType: "teacher", content: "" });

function safeParseJson<T>(raw: string, fallback: T): T {
  try { const v = JSON.parse(raw); return (v && typeof v === "object") ? v as T : fallback; }
  catch { return fallback; }
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
const labelCls = "mb-1 block text-xs font-medium text-gray-600";
const sectionCls = "rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2";
const addBtnCls = "flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium";
const removeBtnCls = "ml-auto flex-shrink-0 text-red-400 hover:text-red-600 text-xs px-1";

// ── Sub-editors ───────────────────────────────────────────────────────────────

function GrammarEditor({ value, onChange }: { value: GrammarMeta; onChange: (v: GrammarMeta) => void }) {
  const [kwInput, setKwInput] = useState("");

  const setExamples = (examples: GrammarExample[]) => onChange({ ...value, examples });
  const setKeywords = (keywords: string[]) => onChange({ ...value, keywords });

  const addKw = () => {
    const kw = kwInput.trim();
    if (kw && !value.keywords.includes(kw)) {
      setKeywords([...value.keywords, kw]);
      setKwInput("");
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Cấu trúc ngữ pháp</label>
        <input
          value={value.pattern}
          onChange={e => onChange({ ...value, pattern: e.target.value })}
          placeholder="VD: Subject + là + Noun"
          className={`${inputCls} font-mono`}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className={labelCls}>Ví dụ</label>
          <button type="button" className={addBtnCls} onClick={() => setExamples([...value.examples, { vi: "", en: "" }])}>
            + Thêm ví dụ
          </button>
        </div>
        {value.examples.map((ex, i) => (
          <div key={i} className={`${sectionCls} mb-2`}>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
              <button type="button" className={removeBtnCls} onClick={() => setExamples(value.examples.filter((_, j) => j !== i))}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Tiếng Việt</label>
                <input value={ex.vi} onChange={e => { const arr = [...value.examples]; arr[i] = { ...arr[i], vi: e.target.value }; setExamples(arr); }} className={inputCls} placeholder="Tôi là học sinh." />
              </div>
              <div>
                <label className={labelCls}>English</label>
                <input value={ex.en} onChange={e => { const arr = [...value.examples]; arr[i] = { ...arr[i], en: e.target.value }; setExamples(arr); }} className={inputCls} placeholder="I am a student." />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className={labelCls}>Từ khóa</label>
        <div className="flex gap-2">
          <input
            value={kwInput}
            onChange={e => setKwInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKw(); } }}
            placeholder="Nhập từ khóa rồi Enter..."
            className={inputCls}
          />
          <button type="button" onClick={addKw} className="rounded-lg bg-purple-100 px-3 py-2 text-xs text-purple-700 hover:bg-purple-200">Thêm</button>
        </div>
        {value.keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {value.keywords.map((kw, i) => (
              <span key={i} className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {kw}
                <button type="button" className="text-blue-400 hover:text-blue-700" onClick={() => setKeywords(value.keywords.filter((_, j) => j !== i))}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VocabEditor({ value, onChange }: { value: VocabMeta; onChange: (v: VocabMeta) => void }) {
  const setWords = (words: VocabWord[]) => onChange({ words });
  const newWord = (): VocabWord => ({ word: "", ipa: "", meaning: "", audioUrl: "", example: "", exampleTranslation: "" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={labelCls}>Danh sách từ vựng</label>
        <button type="button" className={addBtnCls} onClick={() => setWords([...value.words, newWord()])}>+ Thêm từ</button>
      </div>
      {value.words.map((w, i) => (
        <div key={i} className={sectionCls}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500">Từ {i + 1}</span>
            <button type="button" className="text-red-400 hover:text-red-600 text-xs" onClick={() => setWords(value.words.filter((_, j) => j !== i))}>✕ Xóa</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Từ *</label>
              <input value={w.word} onChange={e => { const arr = [...value.words]; arr[i] = { ...arr[i], word: e.target.value }; setWords(arr); }} className={inputCls} placeholder="học sinh" />
            </div>
            <div>
              <label className={labelCls}>IPA</label>
              <input value={w.ipa} onChange={e => { const arr = [...value.words]; arr[i] = { ...arr[i], ipa: e.target.value }; setWords(arr); }} className={`${inputCls} font-mono`} placeholder="hɔ̌k ʂɨ̌ŋ" />
            </div>
            <div>
              <label className={labelCls}>Nghĩa *</label>
              <input value={w.meaning} onChange={e => { const arr = [...value.words]; arr[i] = { ...arr[i], meaning: e.target.value }; setWords(arr); }} className={inputCls} placeholder="student" />
            </div>
            <div>
              <label className={labelCls}>Audio URL</label>
              <input value={w.audioUrl} onChange={e => { const arr = [...value.words]; arr[i] = { ...arr[i], audioUrl: e.target.value }; setWords(arr); }} className={inputCls} placeholder="demo/assets/audio/..." />
            </div>
            <div>
              <label className={labelCls}>Ví dụ (Tiếng Việt)</label>
              <input value={w.example} onChange={e => { const arr = [...value.words]; arr[i] = { ...arr[i], example: e.target.value }; setWords(arr); }} className={inputCls} placeholder="Tôi là học sinh." />
            </div>
            <div>
              <label className={labelCls}>Ví dụ (English)</label>
              <input value={w.exampleTranslation} onChange={e => { const arr = [...value.words]; arr[i] = { ...arr[i], exampleTranslation: e.target.value }; setWords(arr); }} className={inputCls} placeholder="I am a student." />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuizEditor({ value, onChange }: { value: QuizMeta; onChange: (v: QuizMeta) => void }) {
  const setQuestions = (questions: QuizQuestion[]) => onChange({ ...value, questions });
  const newQuestion = (): QuizQuestion => ({ text: "", type: "multiple_choice", options: ["", "", "", ""], correctIndex: 0, explanation: "" });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Điểm đạt (%)</label>
          <input type="number" min={0} max={100} value={value.passScore} onChange={e => onChange({ ...value, passScore: Number(e.target.value) })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Thời gian (giây, 0 = không giới hạn)</label>
          <input type="number" min={0} value={value.timeLimit} onChange={e => onChange({ ...value, timeLimit: Number(e.target.value) })} className={inputCls} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className={labelCls}>Câu hỏi ({value.questions.length})</label>
        <button type="button" className={addBtnCls} onClick={() => setQuestions([...value.questions, newQuestion()])}>+ Thêm câu</button>
      </div>

      {value.questions.map((q, qi) => (
        <div key={qi} className={sectionCls}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500">Câu {qi + 1}</span>
            {value.questions.length > 1 && (
              <button type="button" className="text-red-400 hover:text-red-600 text-xs" onClick={() => setQuestions(value.questions.filter((_, j) => j !== qi))}>✕ Xóa</button>
            )}
          </div>

          <div>
            <label className={labelCls}>Nội dung câu hỏi *</label>
            <input value={q.text} onChange={e => { const arr = [...value.questions]; arr[qi] = { ...arr[qi], text: e.target.value }; setQuestions(arr); }} className={inputCls} placeholder="Câu nào đúng?" />
          </div>

          <div>
            <label className={labelCls}>Loại câu hỏi</label>
            <select
              value={q.type}
              onChange={e => { const arr = [...value.questions]; arr[qi] = { ...arr[qi], type: e.target.value as QuizQuestionType }; setQuestions(arr); }}
              className={inputCls}
            >
              <option value="multiple_choice">Trắc nghiệm (chọn 1)</option>
              <option value="fill_in_blank">Điền vào chỗ trống</option>
            </select>
          </div>

          {q.type === "multiple_choice" && (
            <div className="space-y-1">
              <label className={labelCls}>Đáp án (chọn đáp án đúng bằng radio ◉)</label>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q${qi}_correct`}
                    checked={q.correctIndex === oi}
                    onChange={() => { const arr = [...value.questions]; arr[qi] = { ...arr[qi], correctIndex: oi }; setQuestions(arr); }}
                    className="accent-purple-600"
                  />
                  <input
                    value={opt}
                    onChange={e => {
                      const arr = [...value.questions];
                      const opts = [...arr[qi].options];
                      opts[oi] = e.target.value;
                      arr[qi] = { ...arr[qi], options: opts };
                      setQuestions(arr);
                    }}
                    className={inputCls}
                    placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                  />
                  {q.options.length > 2 && (
                    <button type="button" className="text-red-400 hover:text-red-600 text-xs flex-shrink-0" onClick={() => {
                      const arr = [...value.questions];
                      const opts = arr[qi].options.filter((_, j) => j !== oi);
                      const ci = arr[qi].correctIndex >= opts.length ? opts.length - 1 : arr[qi].correctIndex;
                      arr[qi] = { ...arr[qi], options: opts, correctIndex: Math.max(0, ci) };
                      setQuestions(arr);
                    }}>✕</button>
                  )}
                </div>
              ))}
              {q.options.length < 6 && (
                <button type="button" className={`${addBtnCls} mt-1`} onClick={() => {
                  const arr = [...value.questions];
                  arr[qi] = { ...arr[qi], options: [...arr[qi].options, ""] };
                  setQuestions(arr);
                }}>+ Thêm đáp án</button>
              )}
            </div>
          )}

          {q.type === "fill_in_blank" && (
            <div>
              <label className={labelCls}>Đáp án đúng</label>
              <input
                value={q.options[0] ?? ""}
                onChange={e => { const arr = [...value.questions]; arr[qi] = { ...arr[qi], options: [e.target.value], correctIndex: 0 }; setQuestions(arr); }}
                className={inputCls} placeholder="Đáp án..." />
            </div>
          )}

          <div>
            <label className={labelCls}>Giải thích (hiển thị sau khi nộp)</label>
            <input value={q.explanation} onChange={e => { const arr = [...value.questions]; arr[qi] = { ...arr[qi], explanation: e.target.value }; setQuestions(arr); }} className={inputCls} placeholder="Cấu trúc: Subject + là + Noun" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExerciseEditor({ value, onChange }: { value: ExerciseMeta; onChange: (v: ExerciseMeta) => void }) {
  const setItems = (items: ExerciseItem[]) => onChange({ ...value, items });

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Loại bài tập</label>
        <select value={value.type} onChange={e => onChange({ ...value, type: e.target.value as ExerciseType })} className={inputCls}>
          <option value="fill_in_blank">Điền vào chỗ trống</option>
          <option value="matching">Nối cột</option>
          <option value="drag_drop">Kéo thả</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className={labelCls}>Danh sách câu ({value.items.length})</label>
        <button type="button" className={addBtnCls} onClick={() => setItems([...value.items, { sentence: "", answer: "" }])}>+ Thêm câu</button>
      </div>

      {value.items.map((item, i) => (
        <div key={i} className={`${sectionCls} flex gap-2 items-start`}>
          <span className="text-xs text-gray-400 pt-2 w-5 flex-shrink-0">{i + 1}.</span>
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>{value.type === "matching" ? "Vế trái" : "Câu"}</label>
              <input value={item.sentence} onChange={e => { const arr = [...value.items]; arr[i] = { ...arr[i], sentence: e.target.value }; setItems(arr); }} className={inputCls} placeholder={value.type === "fill_in_blank" ? "Tôi ___ học sinh." : "Câu / Từ..."} />
            </div>
            <div>
              <label className={labelCls}>{value.type === "matching" ? "Vế phải" : "Đáp án"}</label>
              <input value={item.answer} onChange={e => { const arr = [...value.items]; arr[i] = { ...arr[i], answer: e.target.value }; setItems(arr); }} className={inputCls} placeholder="là" />
            </div>
          </div>
          {value.items.length > 1 && (
            <button type="button" className="text-red-400 hover:text-red-600 text-xs pt-2 flex-shrink-0" onClick={() => setItems(value.items.filter((_, j) => j !== i))}>✕</button>
          )}
        </div>
      ))}
    </div>
  );
}

function NoteEditor({ value, onChange }: { value: NoteMeta; onChange: (v: NoteMeta) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Loại ghi chú</label>
        <select value={value.authorType} onChange={e => onChange({ ...value, authorType: e.target.value as "teacher" | "student" })} className={inputCls}>
          <option value="teacher">📌 Ghi chú giáo viên</option>
          <option value="student">📝 Ghi chú học viên</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Nội dung</label>
        <textarea
          value={value.content}
          onChange={e => onChange({ ...value, content: e.target.value })}
          rows={4}
          maxLength={1000}
          className={inputCls}
          placeholder="Lưu ý quan trọng cho học viên..."
        />
        <p className="mt-1 text-xs text-gray-400">{value.content.length}/1000 ký tự</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  assetType: string;
  /** JSON string — đọc khi mount, serialize ra khi thay đổi */
  value: string;
  onChange: (jsonString: string) => void;
}

export function AssetMetadataEditor({ assetType, value, onChange }: Props) {
  // Parse JSON một lần khi mount / assetType đổi
  const [grammar, setGrammar] = useState<GrammarMeta>(() => safeParseJson(value, defaultGrammar()));
  const [vocab, setVocab] = useState<VocabMeta>(() => safeParseJson(value, defaultVocab()));
  const [quiz, setQuiz] = useState<QuizMeta>(() => safeParseJson(value, defaultQuiz()));
  const [exercise, setExercise] = useState<ExerciseMeta>(() => safeParseJson(value, defaultExercise()));
  const [note, setNote] = useState<NoteMeta>(() => safeParseJson(value, defaultNote()));

  // Khi assetType thay đổi (thêm mới), reset về default
  const prevType = useRef(assetType);
  useEffect(() => {
    if (prevType.current !== assetType) {
      prevType.current = assetType;
      setGrammar(safeParseJson(value, defaultGrammar()));
      setVocab(safeParseJson(value, defaultVocab()));
      setQuiz(safeParseJson(value, defaultQuiz()));
      setExercise(safeParseJson(value, defaultExercise()));
      setNote(safeParseJson(value, defaultNote()));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetType]);

  const emit = useCallback((data: unknown) => onChange(JSON.stringify(data)), [onChange]);

  if (assetType === "GrammarBlock") {
    return <GrammarEditor value={grammar} onChange={v => { setGrammar(v); emit(v); }} />;
  }
  if (assetType === "VocabularyBlock") {
    return <VocabEditor value={vocab} onChange={v => { setVocab(v); emit(v); }} />;
  }
  if (assetType === "QuizBlock") {
    return <QuizEditor value={quiz} onChange={v => { setQuiz(v); emit(v); }} />;
  }
  if (assetType === "ExerciseBlock") {
    return <ExerciseEditor value={exercise} onChange={v => { setExercise(v); emit(v); }} />;
  }
  if (assetType === "NoteBlock") {
    return <NoteEditor value={note} onChange={v => { setNote(v); emit(v); }} />;
  }

  // PPTBlock / FileAttachment — metadata tự sinh từ file upload
  return (
    <p className="text-xs text-gray-400 italic py-2">
      Metadata sẽ tự động được tạo khi bạn upload file ở trên.
    </p>
  );
}
