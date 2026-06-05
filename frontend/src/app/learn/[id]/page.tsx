"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetSessionQuery,
  useStartSessionMutation,
  useSaveSessionVideoPositionMutation,
  useCompleteSessionMutation,
  useMarkSegmentViewedMutation,
  useCompleteSegmentMutation,
  useRecordAssetInteractionMutation,
  useSubmitQuizMutation,
  type QuizAnswerFeedback,
  type SegmentLearningDto,
  type SegmentAssetDto,
} from "@/lib/features/learning/learningApi";
import dynamic from "next/dynamic";
import HlsPlayer, { type HlsPlayerControls } from "@/components/video/HlsPlayer";
import CommentPanel from "@/components/comments/CommentPanel";
const QASection = dynamic(() => import("@/components/qa/QASection"), { ssr: false });
import {
  useGetSessionVideoQuizQuery,
  useStartQuizAttemptMutation,
  useSaveAnswerMutation as useQuizSaveAnswerMutation,
  useSubmitAttemptMutation,
  type AttemptQuestionDto,
} from "@/lib/features/quiz/quizApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function parseMetadata(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw); } catch { return {}; }
}

// ── Theme Context (propagates isDark to sub-components) ──────────────────────────
const ThemeCtx = createContext<boolean>(true); // true = dark

// ── Asset Panel Components ────────────────────────────────────────────────────

interface AssetPanelProps {
  asset: SegmentAssetDto;
  onInteract?: (interactionType: string) => void;
}

function NoteBlockPanel({ asset, onInteract }: AssetPanelProps) {
  const isDark = useContext(ThemeCtx);
  const meta = parseMetadata(asset.metadata) as { content?: string; highlights?: string[] };
  useEffect(() => { onInteract?.("Viewed"); }, []);

  return (
    <div className={`rounded-xl border p-4 ${isDark ? "border-yellow-700/40 bg-yellow-900/20" : "border-yellow-200 bg-yellow-50"}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-yellow-500">📝</span>
        <h4 className={`font-semibold text-sm ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>{asset.title}</h4>
      </div>
      <p className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>{meta.content}</p>
      {meta.highlights && meta.highlights.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {meta.highlights.map((h, i) => (
            <span key={i} className={`rounded-full px-2 py-0.5 text-xs ${isDark ? "bg-yellow-800/50 text-yellow-200" : "bg-yellow-100 text-yellow-700"}`}>{h}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function GrammarBlockPanel({ asset, onInteract }: AssetPanelProps) {
  const isDark = useContext(ThemeCtx);
  const meta = parseMetadata(asset.metadata) as { pattern?: string; examples?: { vi: string; en: string }[]; keywords?: string[] };
  useEffect(() => { onInteract?.("Viewed"); }, []);

  return (
    <div className={`rounded-xl border p-4 ${isDark ? "border-blue-700/40 bg-blue-900/20" : "border-blue-200 bg-blue-50"}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={isDark ? "text-blue-400" : "text-blue-600"}>📐</span>
        <h4 className={`font-semibold text-sm ${isDark ? "text-blue-300" : "text-blue-700"}`}>{asset.title}</h4>
      </div>
      {meta.pattern && (
        <div className={`mb-3 rounded-lg px-3 py-2 font-mono text-sm ${isDark ? "bg-blue-950/60 text-blue-200" : "bg-blue-100 text-blue-700"}`}>
          {meta.pattern}
        </div>
      )}
      {meta.examples && meta.examples.length > 0 && (
        <div className="space-y-2">
          {meta.examples.map((ex, i) => (
            <div key={i} className={`rounded-lg px-3 py-2 text-sm ${isDark ? "bg-gray-800/60" : "bg-white border border-blue-100"}`}>
              <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{ex.vi}</div>
              <div className={isDark ? "text-gray-400" : "text-gray-500"}>{ex.en}</div>
            </div>
          ))}
        </div>
      )}
      {meta.keywords && meta.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {meta.keywords.map((k, i) => (
            <span key={i} className={`rounded-full px-2 py-0.5 text-xs ${isDark ? "bg-blue-800/50 text-blue-200" : "bg-blue-100 text-blue-700"}`}>{k}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function VocabularyBlockPanel({ asset, onInteract }: AssetPanelProps) {
  const isDark = useContext(ThemeCtx);
  const tr = useTranslations("learn_player");
  const meta = parseMetadata(asset.metadata) as { words?: { word: string; ipa?: string; meaning: string; example?: string; exampleTranslation?: string }[] };
  const [expanded, setExpanded] = useState<number | null>(null);
  useEffect(() => { onInteract?.("Viewed"); }, []);

  return (
    <div className={`rounded-xl border p-4 ${isDark ? "border-green-700/40 bg-green-900/20" : "border-green-200 bg-green-50"}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={isDark ? "text-green-400" : "text-green-600"}>📚</span>
        <h4 className={`font-semibold text-sm ${isDark ? "text-green-300" : "text-green-700"}`}>{asset.title}</h4>
        {meta.words && <span className={`ml-auto text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{tr("vocabulary_word_count", { count: meta.words.length })}</span>}
      </div>
      <div className="space-y-1.5">
        {meta.words?.map((w, i) => (
          <div key={i} className={`rounded-lg overflow-hidden border ${isDark ? "border-gray-700/50" : "border-green-100"}`}>
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${isDark ? "hover:bg-gray-800/60" : "hover:bg-green-100/60"}`}
            >
              <span className={`font-semibold min-w-[80px] ${isDark ? "text-green-300" : "text-green-700"}`}>{w.word}</span>
              {w.ipa && <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{w.ipa}</span>}
              <span className={`flex-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>{w.meaning}</span>
              <svg className={`h-3.5 w-3.5 shrink-0 transition-transform ${isDark ? "text-gray-500" : "text-gray-400"} ${expanded === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded === i && w.example && (
              <div className={`border-t px-3 py-2 text-xs ${isDark ? "border-gray-700/50 bg-gray-800/40" : "border-green-100 bg-green-50"}`}>
                <div className={`italic ${isDark ? "text-gray-300" : "text-gray-600"}`}>{w.example}</div>
                <div className={`mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{w.exampleTranslation}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── QuizBlock ─────────────────────────────────────────────────────────────────

interface QuizQuestion {
  text: string;
  type?: string;
  options?: string[];
  correct?: number;
  explanation?: string;
}
interface QuizMeta { passScore?: number; timeLimit?: number; questions?: QuizQuestion[] }

function QuizBlockPanel({ asset, onInteract }: AssetPanelProps) {
  const isDark = useContext(ThemeCtx);
  const tr = useTranslations("learn_player");
  const meta = parseMetadata(asset.metadata) as QuizMeta;
  const questions = meta.questions ?? [];
  const passScore = meta.passScore ?? 70;

  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [serverFeedback, setServerFeedback] = useState<QuizAnswerFeedback[] | null>(null);

  const [submitQuiz, { isLoading: submitting }] = useSubmitQuizMutation();

  useEffect(() => { onInteract?.("Viewed"); }, []);

  async function handleSubmit() {
    const validAnswers = answers as number[];
    try {
      const result = await submitQuiz({ id: asset.id, answers: validAnswers }).unwrap();
      setScore(result.score);
      setPassed(result.passed);
      setServerFeedback(result.feedback);
      setSubmitted(true);
      onInteract?.(result.passed ? "QuizPassed" : "QuizFailed");
    } catch {
      // Fallback: local evaluation using correct field from metadata
      let correct = 0;
      questions.forEach((q, i) => { if (validAnswers[i] === q.correct) correct++; });
      const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
      setScore(pct);
      setPassed(pct >= passScore);
      setServerFeedback(null);
      setSubmitted(true);
      onInteract?.(pct >= passScore ? "QuizPassed" : "QuizFailed");
    }
  }

  return (
    <div className={`rounded-xl border p-4 ${isDark ? "border-yellow-700/40 bg-yellow-900/10" : "border-yellow-200 bg-yellow-50"}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-yellow-500">❓</span>
        <h4 className={`font-semibold text-sm flex-1 ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>{asset.title}</h4>
        <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{tr("quiz_pass_score", { passScore })}</span>
      </div>

      {submitted ? (
        <div className={`rounded-lg p-4 text-center border ${
          passed
            ? isDark ? "bg-green-900/30 border-green-700/40" : "bg-green-50 border-green-200"
            : isDark ? "bg-red-900/30 border-red-700/40" : "bg-red-50 border-red-200"
        }`}>
          <div className="text-2xl mb-1">{passed ? "✅" : "❌"}</div>
          <div className={`text-sm font-semibold ${passed ? isDark ? "text-green-300" : "text-green-700" : isDark ? "text-red-300" : "text-red-700"}`}>
            {passed ? tr("quiz_passed") : tr("quiz_failed")} — {score}%
          </div>
          <div className="mt-3 space-y-2">
            {questions.map((q, i) => {
              const fb = serverFeedback?.[i];
              const isCorrect = fb ? fb.correct : answers[i] === q.correct;
              const correctIdx = fb ? fb.correctAnswer : q.correct;
              const explanation = fb?.explanation ?? q.explanation;
              return (
                <div key={i} className={`rounded-lg px-3 py-2 text-xs text-left ${isCorrect ? isDark ? "bg-green-900/20" : "bg-green-50" : isDark ? "bg-red-900/20" : "bg-red-50"}`}>
                  <div className={`font-medium mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{q.text}</div>
                  {q.options && answers[i] !== null && (
                    <div className={`${isCorrect ? isDark ? "text-green-300" : "text-green-700" : isDark ? "text-red-300" : "text-red-700"}`}>
                      {tr("quiz_your_choice")} {q.options[answers[i]!]}
                      {!isCorrect && correctIdx !== undefined && <span className={isDark ? "text-green-400 ml-2" : "text-green-600 ml-2"}>{tr("quiz_correct_is")} {q.options[correctIdx]}</span>}
                    </div>
                  )}
                  {explanation && <div className={`mt-0.5 italic ${isDark ? "text-gray-400" : "text-gray-500"}`}>{explanation}</div>}
                </div>
              );
            })}
          </div>
          <button onClick={() => { setAnswers(questions.map(() => null)); setSubmitted(false); setServerFeedback(null); }} className={`mt-3 text-xs underline ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>{tr("quiz_redo")}</button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i}>
              <p className={`text-sm font-medium mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>{i + 1}. {q.text}</p>
              {q.options && (
                <div className="space-y-1.5">
                  {q.options.map((opt, j) => (
                    <button
                      key={j}
                      onClick={() => { const a = [...answers]; a[i] = j; setAnswers(a); }}
                      className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition
                        ${answers[i] === j
                          ? isDark ? "border-yellow-500 bg-yellow-900/30 text-yellow-200" : "border-yellow-500 bg-yellow-50 text-yellow-700"
                          : isDark ? "border-gray-700 bg-gray-800/30 text-gray-300 hover:border-gray-500" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
                    >
                      <span className={`mr-2 text-xs font-mono ${isDark ? "text-gray-500" : "text-gray-400"}`}>{String.fromCharCode(65 + j)}.</span>{opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {questions.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={answers.some(a => a === null) || submitting}
              className="mt-2 w-full rounded-lg bg-yellow-600 py-2 text-sm font-semibold text-white transition hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? tr("quiz_submitting") : tr("quiz_submit_btn")}
            </button>
          )}
          {questions.length === 0 && <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{tr("quiz_no_questions")}</p>}
        </div>
      )}
    </div>
  );
}

// ── ExerciseBlock ─────────────────────────────────────────────────────────────

interface ExerciseItem { sentence: string; answer: string }
interface ExerciseMeta { type?: string; items?: ExerciseItem[] }

function ExerciseBlockPanel({ asset, onInteract }: AssetPanelProps) {
  const isDark = useContext(ThemeCtx);
  const tr = useTranslations("learn_player");
  const meta = parseMetadata(asset.metadata) as ExerciseMeta;
  const items = meta.items ?? [];

  const [inputs, setInputs] = useState<string[]>(() => items.map(() => ""));
  const [checked, setChecked] = useState(false);

  useEffect(() => { onInteract?.("Viewed"); }, []);

  const parts = (sentence: string) => sentence.split("___");

  return (
    <div className={`rounded-xl border p-4 ${isDark ? "border-orange-700/40 bg-orange-900/10" : "border-orange-200 bg-orange-50"}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={isDark ? "text-orange-400" : "text-orange-500"}>✏️</span>
        <h4 className={`font-semibold text-sm ${isDark ? "text-orange-300" : "text-orange-700"}`}>{asset.title}</h4>
      </div>
      {items.length === 0 && <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{tr("exercise_no_items")}</p>}
      <div className="space-y-3">
        {items.map((item, i) => {
          const segs = parts(item.sentence);
          const isCorrect = inputs[i].trim().toLowerCase() === item.answer.trim().toLowerCase();
          return (
            <div key={i} className="flex flex-wrap items-center gap-1 text-sm">
              <span className={`text-xs mr-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{i + 1}.</span>
              {segs[0] && <span className={isDark ? "text-gray-200" : "text-gray-700"}>{segs[0]}</span>}
              <input
                value={inputs[i]}
                onChange={e => { const a = [...inputs]; a[i] = e.target.value; setInputs(a); }}
                disabled={checked}
                placeholder="___"
                className={`rounded border px-2 py-0.5 text-sm w-28 outline-none transition
                  ${isDark
                    ? checked
                      ? isCorrect ? "bg-gray-800 border-green-500 text-green-300" : "bg-gray-800 border-red-500 text-red-300"
                      : "bg-gray-800 border-gray-600 text-white focus:border-orange-500"
                    : checked
                      ? isCorrect ? "bg-white border-green-500 text-green-700" : "bg-white border-red-500 text-red-700"
                      : "bg-white border-gray-300 text-gray-900 focus:border-orange-400"}`}
              />
              {segs[1] && <span className={isDark ? "text-gray-200" : "text-gray-700"}>{segs[1]}</span>}
              {checked && !isCorrect && (
                <span className={`text-xs ml-1 ${isDark ? "text-green-400" : "text-green-600"}`}>→ {item.answer}</span>
              )}
            </div>
          );
        })}
      </div>
      {items.length > 0 && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setChecked(true)}
            disabled={checked || inputs.some(v => !v.trim())}
            className="flex-1 rounded-lg bg-orange-700 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {tr("exercise_check")}
          </button>
          {checked && (
            <button onClick={() => { setInputs(items.map(() => "")); setChecked(false); }} className={`rounded-lg border px-3 py-2 text-xs transition ${isDark ? "border-gray-600 text-gray-300 hover:border-gray-400" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}>
              {tr("exercise_redo")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── PPTBlock ──────────────────────────────────────────────────────────────────

interface PPTMeta { fileUrl?: string; fileName?: string; slideCount?: number }

function getDocViewerUrl(resolvedUrl: string, fileName?: string): { iframeUrl: string; isPdf: boolean } {
  const ext = (fileName?.split(".").pop() ?? "").toLowerCase();
  if (ext === "pdf" || ext === "") {
    return { iframeUrl: `${resolvedUrl}#toolbar=0&navpanes=0&scrollbar=0`, isPdf: true };
  }
  return {
    iframeUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedUrl)}`,
    isPdf: false,
  };
}

function PPTBlockPanel({ asset, onInteract }: AssetPanelProps) {
  const isDark = useContext(ThemeCtx);
  const tr = useTranslations("learn_player");
  const meta = parseMetadata(asset.metadata) as PPTMeta;
  const fileUrl = meta.fileUrl;
  const [viewing, setViewing] = useState(false);

  useEffect(() => { onInteract?.("Viewed"); }, []);

  const resolvedUrl = fileUrl
    ? (fileUrl.startsWith("http") ? fileUrl : `${API_BASE}/media/${fileUrl}`)
    : null;

  const viewer = resolvedUrl ? getDocViewerUrl(resolvedUrl, meta.fileName) : null;
  const ext = (meta.fileName?.split(".").pop() ?? "").toLowerCase();
  const isOfficeFile = ["pptx", "ppt", "docx", "doc", "xlsx", "xls"].includes(ext);

  return (
    <div className={`rounded-xl border p-4 ${isDark ? "border-teal-700/40 bg-teal-900/10" : "border-teal-200 bg-teal-50"}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={isDark ? "text-teal-400" : "text-teal-600"}>📊</span>
        <h4 className={`font-semibold text-sm flex-1 ${isDark ? "text-teal-300" : "text-teal-700"}`}>{asset.title}</h4>
        {meta.slideCount && <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{tr("ppt_page_count", { count: meta.slideCount })}</span>}
        {meta.fileName && <span className={`text-xs uppercase ${isDark ? "text-gray-600" : "text-gray-400"}`}>{ext}</span>}
      </div>
      {resolvedUrl && viewer ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setViewing(v => !v)}
              className={`flex-1 rounded-lg border py-2 text-sm transition ${isDark ? "border-teal-700/40 bg-teal-800/20 text-teal-300 hover:bg-teal-800/40" : "border-teal-200 bg-teal-100 text-teal-700 hover:bg-teal-200"}`}
            >
              {viewing ? tr("ppt_hide") : tr("ppt_show")}
            </button>
            <a
              href={resolvedUrl}
              download={meta.fileName}
              className={`rounded-lg border px-3 py-2 text-sm transition ${isDark ? "border-gray-700 bg-gray-800/40 text-gray-400 hover:bg-gray-700/40" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
              title={tr("ppt_download")}
            >
              ⬇
            </a>
          </div>
          {isOfficeFile && (
            <p className="text-xs text-amber-500/70">
              {tr("ppt_office_warning")}
            </p>
          )}
          {viewing && (
            <div className={`mt-1 rounded-lg overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-200"}`} style={{ height: 460 }}>
              <iframe
                src={viewer.iframeUrl}
                className="w-full h-full border-0"
                title={asset.title}
                sandbox={viewer.isPdf ? undefined : "allow-scripts allow-same-origin allow-forms allow-popups"}
              />
            </div>
          )}
        </div>
      ) : (
        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{tr("ppt_no_document")}</p>
      )}
    </div>
  );
}

// ── FileAttachment ────────────────────────────────────────────────────────────

interface FileMeta { fileUrl?: string; fileName?: string; fileSize?: number }

function FileAttachmentPanel({ asset, onInteract }: AssetPanelProps) {
  const isDark = useContext(ThemeCtx);
  const tr = useTranslations("learn_player");
  const meta = parseMetadata(asset.metadata) as FileMeta;
  const fileUrl = meta.fileUrl;

  useEffect(() => { onInteract?.("Viewed"); }, []);

  const resolvedUrl = fileUrl
    ? (fileUrl.startsWith("http") ? fileUrl : `${API_BASE}/media/${fileUrl}`)
    : null;

  function fmtSize(bytes?: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const ext = (meta.fileName ?? "").split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <div className={`rounded-xl border p-4 ${isDark ? "border-red-700/40 bg-red-900/10" : "border-red-200 bg-red-50"}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={isDark ? "text-red-400" : "text-red-500"}>📎</span>
        <h4 className={`font-semibold text-sm flex-1 ${isDark ? "text-red-300" : "text-red-700"}`}>{asset.title}</h4>
      </div>
      {resolvedUrl ? (
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800/40" : "border-gray-200 bg-white"}`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isDark ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-600"}`}>
            {ext}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>{meta.fileName ?? asset.title}</p>
            {meta.fileSize && <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{fmtSize(meta.fileSize)}</p>}
          </div>
          <a
            href={resolvedUrl}
            download={meta.fileName}
            onClick={() => onInteract?.("Viewed")}
            className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition"
          >
            {tr("file_download")}
          </a>
        </div>
      ) : (
        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{tr("file_no_attachment")}</p>
      )}
    </div>
  );
}

// ── AssetPanel dispatcher ─────────────────────────────────────────────────────

function AssetPanel(props: AssetPanelProps) {
  const isDark = useContext(ThemeCtx);
  switch (props.asset.type) {
    case "NoteBlock":        return <NoteBlockPanel {...props} />;
    case "GrammarBlock":     return <GrammarBlockPanel {...props} />;
    case "VocabularyBlock":  return <VocabularyBlockPanel {...props} />;
    case "QuizBlock":        return <QuizBlockPanel {...props} />;
    case "ExerciseBlock":    return <ExerciseBlockPanel {...props} />;
    case "PPTBlock":         return <PPTBlockPanel {...props} />;
    case "FileAttachment":   return <FileAttachmentPanel {...props} />;
    default:
      return (
        <div className={`rounded-xl border p-4 text-sm ${isDark ? "border-gray-700 bg-gray-800/30 text-gray-400" : "border-gray-200 bg-gray-50 text-gray-500"}`}>
          <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{props.asset.title}</span>
          <span className="ml-2 text-xs">({props.asset.type})</span>
        </div>
      );
  }
}

// ── Segment Timeline Bar ──────────────────────────────────────────────────────

interface TimelineBarProps {
  segments: SegmentLearningDto[];
  duration: number;
  currentTime: number;
  onJump: (time: number) => void;
}

function SegmentTimelineBar({ segments, duration, currentTime, onJump }: TimelineBarProps) {
  if (!duration || !segments.length) return null;

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-800 cursor-pointer" title="Jump to segment">
      {segments.map((seg, i) => {
        const left = (seg.startTime / duration) * 100;
        const width = ((seg.endTime - seg.startTime) / duration) * 100;
        const isActive = currentTime >= seg.startTime && currentTime < seg.endTime;
        const isViewed = seg.progress?.isViewed ?? false;
        const isCompleted = seg.progress?.isCompleted ?? false;

        return (
          <div
            key={seg.id}
            className="relative"
            style={{ width: `${width}%`, marginLeft: i === 0 ? `${left}%` : undefined }}
          >
            <div
              onClick={() => onJump(seg.startTime)}
              className={[
                "h-full w-full rounded-sm transition",
                isActive ? "bg-blue-400" : isCompleted ? "bg-green-500/70" : isViewed ? "bg-blue-700/60" : "bg-gray-600/60",
                "hover:opacity-80",
              ].join(" ")}
              title={seg.title}
            />
          </div>
        );
      })}
      {/* playhead */}
      <div
        className="absolute top-0 h-2 w-0.5 bg-white/80 rounded-full"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SessionPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const tr = useTranslations("learn_player");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [commentOpen, setCommentOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const seekRef = useRef<((t: number) => void) | null>(null);
  const controlRef = useRef<HlsPlayerControls | null>(null);
  const positionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showVideoQuiz, setShowVideoQuiz] = useState(false);
  const videoQuizTriggeredRef = useRef(false);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = localStorage.getItem("learnTheme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);
  const isDark = theme === "dark";
  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("learnTheme", next);
  };
  const t = {
    page:       isDark ? "bg-gray-950 text-white"           : "bg-gray-50 text-gray-900",
    header:     isDark ? "border-gray-800 bg-gray-900"      : "border-gray-200 bg-white",
    hText:      isDark ? "text-gray-400 hover:text-white"   : "text-gray-500 hover:text-gray-800",
    hTitle:     isDark ? "text-white"                       : "text-gray-900",
    divider:    isDark ? "text-gray-700"                    : "text-gray-300",
    subpanel:   isDark ? "bg-gray-900/60 border-gray-800"   : "bg-gray-50 border-gray-200",
    card:       isDark ? "bg-gray-900/40 border-gray-800"   : "bg-white border-gray-200",
    muted:      isDark ? "text-gray-400"                    : "text-gray-500",
    faint:      isDark ? "text-gray-600"                    : "text-gray-400",
    bar:        isDark ? "bg-gray-700"                      : "bg-gray-200",
    sidebar:    isDark ? "border-gray-800 bg-gray-900"      : "border-gray-200 bg-white",
    sideTab:    isDark ? "border-gray-800"                  : "border-gray-200",
    sideTabOff: isDark ? "text-gray-500 hover:text-gray-300": "text-gray-400 hover:text-gray-600",
    segBtn:     isDark ? "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200" : "text-gray-600 hover:bg-gray-100 hover:text-gray-700",
    segActive:  isDark ? "border-purple-500 bg-purple-950/50 text-white" : "border-purple-500 bg-purple-50 text-gray-900",
    numBadge:   isDark ? "border-gray-600 text-gray-600"    : "border-gray-300 text-gray-400",
    progress:   isDark ? "text-gray-500"                    : "text-gray-500",
    assetHint:  isDark ? "text-gray-600"                    : "text-gray-400",
  };

  const isHydrated = useAppSelector((state) => state.auth.isHydrated);
  const { data: session, isLoading } = useGetSessionQuery(id, { skip: !id || !isHydrated });
  const { data: videoQuizMeta } = useGetSessionVideoQuizQuery(id, { skip: !id || !isHydrated });
  const [startSession]           = useStartSessionMutation();
  const [saveVideoPosition]      = useSaveSessionVideoPositionMutation();
  const [completeSession]        = useCompleteSessionMutation();
  const [markSegmentViewed]      = useMarkSegmentViewedMutation();
  const [completeSegment]        = useCompleteSegmentMutation();
  const [recordAssetInteraction] = useRecordAssetInteractionMutation();

  // Start session on mount
  useEffect(() => {
    if (session && !session.progress) startSession(id);
  }, [session, id, startSession]);

  // Resume position
  useEffect(() => {
    if (session?.progress?.lastPositionSeconds && session.progress.lastPositionSeconds > 5) {
      setCurrentTime(session.progress.lastPositionSeconds);
    }
  }, [session?.progress?.lastPositionSeconds]);

  // Update active segment based on currentTime
  useEffect(() => {
    if (!session?.segments) return;
    const seg = session.segments.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    );
    if (seg && seg.id !== activeSegmentId) {
      setActiveSegmentId(seg.id);
      // mark segment as viewed
      if (!seg.progress?.isViewed) {
        markSegmentViewed(seg.id);
      }
    }
  }, [currentTime, session?.segments, activeSegmentId, markSegmentViewed]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);

    // Video quiz trigger — check every tick, no debounce
    if (
      videoQuizMeta?.videoTriggerSecond != null &&
      !videoQuizTriggeredRef.current &&
      time >= videoQuizMeta.videoTriggerSecond
    ) {
      videoQuizTriggeredRef.current = true;
      controlRef.current?.pause();
      setShowVideoQuiz(true);
    }

    // Throttle position save — debounce 5s
    if (positionSaveTimer.current) clearTimeout(positionSaveTimer.current);
    positionSaveTimer.current = setTimeout(() => {
      if (session?.durationSeconds) {
        const watchPct = Math.min((time / session.durationSeconds) * 100, 100);
        saveVideoPosition({
          id,
          lastPositionSeconds: Math.floor(time),
          watchedSeconds: Math.floor(time),
          watchPercentage: watchPct,
        });
      }
    }, 5000);
  }, [id, session?.durationSeconds, saveVideoPosition, videoQuizMeta]);

  const handleEnded = useCallback(async () => {
    await completeSession(id);
  }, [id, completeSession]);

  const handleJumpToTime = useCallback((time: number) => {
    setCurrentTime(time);
    seekRef.current?.(time);
  }, []);

  const handleAssetInteract = useCallback(
    (assetId: string, interactionType: string) => {
      recordAssetInteraction({ id: assetId, interactionType });
    },
    [recordAssetInteraction]
  );

  const handleCompleteSegment = useCallback(
    (segmentId: string) => {
      completeSegment(segmentId);
    },
    [completeSegment]
  );

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`flex h-[calc(100vh-56px)] items-center justify-center ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }} />
      </div>
    );
  }
  if (!session) {
    return (
      <div className={`flex h-[calc(100vh-56px)] items-center justify-center ${t.page}`}>
        <p className={t.muted}>{tr("session_not_found")}</p>
      </div>
    );
  }

  const activeSegment = session.segments.find((s) => s.id === activeSegmentId) ?? session.segments[0] ?? null;
  const isSessionCompleted = session.progress?.status === "Completed";

  // Assets to show for the active segment that are in range (startTime <= currentTime)
  const visibleAssets = activeSegment
    ? activeSegment.assets.filter((a) => currentTime >= a.startTime)
    : [];

  return (
    <ThemeCtx.Provider value={isDark}>
    <div className={`flex flex-col h-[calc(100vh-56px)] overflow-hidden ${t.page}`}>

      {/* Sub-header */}
      <div className={`flex shrink-0 items-center gap-2 border-b px-4 py-2 text-sm ${t.header}`}>
          <button onClick={() => router.back()} className={`flex items-center gap-1 transition ${t.hText}`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {tr("back")}
          </button>
          <span className={`mx-2 ${t.divider}`}>|</span>
          <span className={`truncate font-medium ${t.hTitle}`}>{session.title}</span>

          <div className="ml-auto flex items-center gap-2">
            {isSessionCompleted && (
              <span className="inline-flex items-center gap-1 rounded border border-green-600 bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {tr("session_completed")}
              </span>
            )}
            {session.progress && !isSessionCompleted && (
              <span className="text-xs text-gray-500">
                {Math.round(session.progress.watchPercentage)}{tr("watched_suffix")}
              </span>
            )}
            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? tr("theme_to_light") : tr("theme_to_dark")}
              className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                isDark
                  ? "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                  : "border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-400"
              }`}
            >
              {isDark ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition lg:hidden ${
                isDark ? "border-gray-700 text-gray-400 hover:text-white" : "border-gray-300 text-gray-500 hover:text-gray-800"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {tr("content")}
            </button>
          </div>
        </div>

      {/* ── Content row: main area + segments aside ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:order-2">

        {/* Content area — changes based on sessionType */}
        {(session.sessionType === "Reading") ? (
          <div className="scroll-area flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
            <div
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: session.content ?? "" }}
            />
          </div>
        ) : (session.sessionType === "Audio") ? (
          <div className={`shrink-0 flex flex-col items-center justify-center gap-6 px-6 py-12 ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-800/30">
              <svg className="h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <audio
              controls
              src={session.audioUrl ?? ""}
              className="w-full max-w-md"
              style={{ accentColor: "#7C3AED" }}
            />
          </div>
        ) : (session.sessionType === "Pdf") ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <iframe
              src={session.documentUrl ?? ""}
              className="w-full flex-1 border-0"
              style={{ minHeight: "60vh" }}
              title={session.title}
            />
          </div>
        ) : (
          /* Interactive / Video — 2 columns: [video + below-video] | [comments] */
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left column: video player + scrollable below-video content */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <div className="shrink-0 bg-black">
                {session.videoAsset?.hlsPath ? (
                  <HlsPlayer
                    src={`${API_BASE}/media/${session.videoAsset.hlsPath}`}
                    lessonId={id}
                    onEnded={handleEnded}
                    startTime={session.progress?.lastPositionSeconds && session.progress.lastPositionSeconds > 5 ? session.progress.lastPositionSeconds : 0}
                    onTimeUpdate={handleTimeUpdate}
                    seekRef={seekRef}
                    controlRef={controlRef}
                    maxHeight="45vh"
                  />
                ) : (
                  <div
                    className={`flex w-full flex-col items-center justify-center gap-3 ${isDark ? "bg-gray-900 text-gray-500" : "bg-gray-100 text-gray-400"}`}
                    style={{ aspectRatio: "16/9" }}
                  >
                    <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">{tr("video_missing")}</p>
                  </div>
                )}
              </div>

              {/* Scrollable below-video content */}
              <div className="scroll-area flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">

              {/* Segment Timeline Bar */}
              <div className={`shrink-0 px-4 py-2 border-b ${t.subpanel}`}>
                <div className="relative">
                  <SegmentTimelineBar
                    segments={session.segments}
                    duration={session.durationSeconds}
                    currentTime={currentTime}
                    onJump={handleJumpToTime}
                  />
                </div>
                <div className={`mt-1 flex items-center justify-between text-xs ${t.faint}`}>
                  <span>{fmtTime(currentTime)}</span>
                  <span>{fmtTime(session.durationSeconds)}</span>
                </div>
              </div>

              {/* Active Segment Panel */}
              {activeSegment && (
                <div className={`shrink-0 border-b px-4 py-3 ${t.card}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "#7C3AED" }}>
                        {activeSegment.orderIndex + 1}
                      </span>
                      <div>
                        <h3 className={`text-sm font-semibold ${t.hTitle}`}>{activeSegment.title}</h3>
                        <p className={`text-xs ${t.muted}`}>{fmtTime(activeSegment.startTime)} – {fmtTime(activeSegment.endTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeSegment.progress?.isCompleted ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {tr("segment_done")}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCompleteSegment(activeSegment.id)}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition ${isDark ? "bg-purple-800/50 text-purple-300 hover:bg-purple-700/60" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
                        >
                          {tr("segment_mark_done")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Assets for active segment */}
              <div className="flex-1 px-4 py-4">
                {activeSegment ? (
                  <div>
                    {activeSegment.description && (
                      <p className={`mb-4 text-sm ${t.muted}`}>{activeSegment.description}</p>
                    )}

                    {visibleAssets.length === 0 && (
                      <p className={`text-sm italic ${t.assetHint}`}>
                        {activeSegment.assets.length > 0
                          ? tr("asset_hint_watching")
                          : tr("segment_no_resources")}
                      </p>
                    )}

                    <div className="space-y-3">
                      {visibleAssets.map((asset) => (
                        <AssetPanel
                          key={asset.id}
                          asset={asset}
                          onInteract={(type) => handleAssetInteract(asset.id, type)}
                        />
                      ))}
                    </div>

                    {/* Future assets hint */}
                    {activeSegment.assets.length > visibleAssets.length && (
                      <div className={`mt-4 flex items-center gap-2 text-xs ${t.assetHint}`}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {tr("future_assets_hint", { count: activeSegment.assets.length - visibleAssets.length })}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={`text-sm ${t.assetHint}`}>{tr("no_active_segment")}</p>
                )}
              </div>

              {/* Q&A Section */}
              <div className={`px-4 py-6 border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                <QASection sessionId={id} />
              </div>

            </div>{/* end below-video */}
            </div>{/* end left column */}

            {/* Right column: Comment panel (collapsible, no external header) */}
            <div className={`shrink-0 flex flex-col border-l transition-all duration-300 ${t.sidebar} ${commentOpen ? "w-[340px]" : "w-9"}`}>
              {commentOpen ? (
                <CommentPanel
                  sessionId={id}
                  currentTimeSec={Math.floor(currentTime)}
                  onSeek={handleJumpToTime}
                  isDark={isDark}
                  onToggle={() => setCommentOpen(false)}
                />
              ) : (
                <button
                  onClick={() => setCommentOpen(true)}
                  title={tr("show_comments")}
                  className={`flex flex-col items-center justify-center gap-2 w-full h-full transition ${isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
        </div>{/* end main content */}

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Segments aside — col 1 (left) */}
        <aside
          className={[
            "fixed left-0 z-30 flex flex-col",
            "top-[56px] h-[calc(100vh-56px)] w-72 shrink-0",
            `border-r ${t.sidebar}`,
            "transition-transform duration-300 ease-in-out",
            "lg:relative lg:top-auto lg:h-auto lg:translate-x-0 lg:order-first",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          {/* Header */}
          <div className={`flex shrink-0 items-center justify-between border-b px-4 h-[46px] ${t.sideTab}`}>
            <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-300" : "text-gray-600"}`}>{tr("content_with_icon")}</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`px-1 transition lg:hidden ${isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Session progress summary */}
          {session.progress && (
            <div className={`shrink-0 border-b px-4 py-3 ${t.sideTab}`}>
              <div className={`mb-1.5 flex items-center justify-between text-xs ${t.progress}`}>
                <span>{tr("progress")}</span>
                <span>{Math.round(session.progress.watchPercentage)}%</span>
              </div>
              <div className={`h-1.5 w-full overflow-hidden rounded-full ${t.bar}`}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round(session.progress.watchPercentage)}%`, backgroundColor: "#7C3AED" }}
                />
              </div>
            </div>
          )}

          {/* Segment list */}
          <div className="scroll-area flex-1 overflow-y-auto">
            {session.segments.map((seg) => {
              const isActive = seg.id === activeSegmentId;
              const isViewed = seg.progress?.isViewed ?? false;
              const isCompleted = seg.progress?.isCompleted ?? false;

              return (
                <button
                  key={seg.id}
                  onClick={() => {
                    handleJumpToTime(seg.startTime);
                    setSidebarOpen(false);
                  }}
                  className={[
                    "flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left text-sm transition",
                    isActive ? t.segActive : `border-transparent ${t.segBtn}`,
                  ].join(" ")}
                >
                  <span className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isViewed ? (
                      <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : isActive ? (
                      <svg className="h-4 w-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    ) : (
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-xs ${t.numBadge}`}>
                        {seg.orderIndex + 1}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className={`text-sm leading-snug ${isActive ? `font-medium ${t.hTitle}` : ""}`}>
                      {seg.title}
                    </div>
                    <div className={`mt-0.5 flex items-center gap-2 text-xs ${t.faint}`}>
                      <span>{fmtTime(seg.startTime)} – {fmtTime(seg.endTime)}</span>
                      {seg.assets.length > 0 && (
                        <span>· {tr("segment_resource_count", { count: seg.assets.length })}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Complete session CTA */}
          {!isSessionCompleted && (
            <div className={`shrink-0 border-t p-4 ${t.sideTab}`}>
              <button
                onClick={() => completeSession(id)}
                className="w-full rounded border border-green-600 bg-green-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 hover:border-green-700 active:bg-green-800"
              >
                {tr("complete_session")}
              </button>
            </div>
          )}
        </aside>
      </div>{/* end content row */}
    </div>

    {/* Video Quiz Popup */}
    {showVideoQuiz && videoQuizMeta && (
      <VideoQuizPopup
        quizId={videoQuizMeta.id}
        onClose={() => {
          setShowVideoQuiz(false);
          controlRef.current?.play();
        }}
      />
    )}
    </ThemeCtx.Provider>
  );
}

// ── VideoQuizPopup ────────────────────────────────────────────────────────────

const MLS_NAVY = "#1565C0";

function VideoQuizPopup({ quizId, onClose }: { quizId: string; onClose: () => void }) {
  const tr = useTranslations("learn_player");
  const [phase, setPhase] = useState<"loading" | "quiz" | "done">("loading");
  const [questions, setQuestions] = useState<AttemptQuestionDto[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<{ passed: boolean; percentage: number } | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const pendingSave = useRef<{ questionId: string; value: string } | null>(null);

  const [startAttempt] = useStartQuizAttemptMutation();
  const [saveAnswer] = useQuizSaveAnswerMutation();
  const [submitAttempt] = useSubmitAttemptMutation();

  useEffect(() => {
    let cancelled = false;
    startAttempt(quizId)
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        setAttemptId(res.attemptId);
        setQuestions(res.questions ?? []);
        setPhase("quiz");
      })
      .catch(() => { if (!cancelled) onClose(); });
    return () => { cancelled = true; };
  }, [quizId]);

  const flushSave = useCallback(async () => {
    if (!pendingSave.current || !attemptId) return;
    const { questionId, value } = pendingSave.current;
    pendingSave.current = null;
    await saveAnswer({ attemptId, questionId, answer: value }).unwrap().catch(() => {});
  }, [attemptId, saveAnswer]);

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    pendingSave.current = { questionId, value };
  }

  async function navigateTo(idx: number) {
    await flushSave();
    setCurrentIdx(idx);
  }

  async function handleSubmit() {
    if (!attemptId) return;
    await flushSave();
    try {
      const res = await submitAttempt(attemptId).unwrap();
      setResult({ passed: res.passed ?? false, percentage: res.percentage ?? 0 });
      setPhase("done");
    } catch {
      onClose();
    }
  }

  const q = questions[currentIdx];
  const total = questions.length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600,
        maxHeight: "90vh", overflowY: "auto",
        padding: 32, position: "relative", boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "none", border: "none",
          cursor: "pointer", color: "#9CA3AF", fontSize: 22, lineHeight: 1,
        }}>✕</button>

        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6B7280" }}>
            <div style={{ fontSize: 16 }}>{tr("video_quiz_loading")}</div>
          </div>
        )}

        {phase === "quiz" && q && (
          <>
            <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: MLS_NAVY }}>
              {tr("video_quiz_label")}
            </div>
            <VideoQuizQuestionCard
              question={q}
              index={currentIdx}
              total={total}
              answer={answers[q.id] ?? ""}
              onChange={(val) => handleAnswer(q.id, val)}
            />
            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => navigateTo(currentIdx - 1)}
                disabled={currentIdx === 0}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "1px solid #D1D5DB",
                  background: currentIdx === 0 ? "#F3F4F6" : "#fff",
                  color: currentIdx === 0 ? "#9CA3AF" : "#374151",
                  cursor: currentIdx === 0 ? "default" : "pointer", fontSize: 14,
                }}
              >{tr("video_quiz_prev")}</button>

              <div style={{ display: "flex", gap: 6 }}>
                {questions.map((_, i) => (
                  <button key={i} onClick={() => navigateTo(i)} style={{
                    width: 28, height: 28, borderRadius: "50%", border: "none",
                    background: i === currentIdx ? MLS_NAVY : answers[questions[i].id] ? "#BFDBFE" : "#E5E7EB",
                    color: i === currentIdx ? "#fff" : "#374151",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}>{i + 1}</button>
                ))}
              </div>

              {currentIdx < total - 1 ? (
                <button
                  onClick={() => navigateTo(currentIdx + 1)}
                  style={{
                    padding: "10px 20px", borderRadius: 8, border: "none",
                    background: MLS_NAVY, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600,
                  }}
                >{tr("video_quiz_next")}</button>
              ) : (
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: "10px 24px", borderRadius: 8, border: "none",
                    background: "#16A34A", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600,
                  }}
                >{tr("video_quiz_submit")}</button>
              )}
            </div>
          </>
        )}

        {phase === "done" && result && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{result.passed ? "🎉" : "📚"}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: result.passed ? "#16A34A" : "#DC2626", marginBottom: 8 }}>
              {result.passed ? tr("video_quiz_passed") : tr("video_quiz_failed")}
            </div>
            <div style={{ fontSize: 16, color: "#6B7280", marginBottom: 24 }}>
              {tr("video_quiz_score")} <strong style={{ color: "#111827" }}>{result.percentage}%</strong>
            </div>
            <button onClick={onClose} style={{
              padding: "12px 32px", borderRadius: 10, border: "none",
              background: MLS_NAVY, color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
            }}>{tr("video_quiz_continue")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal QuestionCard for video quiz popup (no heading / step counter from outer QuestionCard)
function VideoQuizQuestionCard({
  question, index, total, answer, onChange,
}: {
  question: AttemptQuestionDto;
  index: number;
  total: number;
  answer: string;
  onChange: (val: string) => void;
}) {
  const tr = useTranslations("learn_player");
  const opts = question.options ?? [];

  // FillBlank
  if (question.type === "FillBlank") {
    return (
      <div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>{tr("video_quiz_q_counter", { n: index + 1, total })}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 18 }}
          dangerouslySetInnerHTML={{ __html: question.content }} />
        <input
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder={tr("video_quiz_fillblank_ph")}
          style={{
            width: "100%", padding: "12px 14px", fontSize: 15, borderRadius: 10,
            border: `2px solid ${answer ? MLS_NAVY : "#E5E7EB"}`,
            outline: "none", boxSizing: "border-box", background: "#F9FAFB",
          }}
        />
      </div>
    );
  }

  // MultipleChoice
  if (question.type === "MultipleChoice") {
    const selected = answer ? answer.split(",").filter(Boolean) : [];
    const toggle = (id: string) => {
      const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
      onChange(next.join(","));
    };
    return (
      <div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>{tr("video_quiz_multichoice_header", { n: index + 1, total })}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 18 }}
          dangerouslySetInnerHTML={{ __html: question.content }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opts.map((opt) => {
            const checked = selected.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => toggle(opt.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
                border: `2px solid ${checked ? MLS_NAVY : "#E5E7EB"}`,
                background: checked ? "#EFF6FF" : "#FAFAFA", cursor: "pointer", textAlign: "left",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${checked ? MLS_NAVY : "#D1D5DB"}`,
                  background: checked ? MLS_NAVY : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {checked && <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span style={{ fontSize: 14, color: "#111827" }}>{opt.content}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Matching
  if (question.type === "Matching") {
    let pairs: { key: string; value: string }[] = [];
    try { pairs = answer ? JSON.parse(answer) : []; } catch { pairs = []; }
    const allValues = opts.map((o) => o.matchValue ?? "").filter(Boolean);
    const setMatch = (key: string, value: string) => {
      const next = opts.map((o) => {
        const k = o.matchKey ?? o.id;
        return { key: k, value: k === key ? value : (pairs.find((p) => p.key === k)?.value ?? "") };
      });
      onChange(JSON.stringify(next));
    };
    return (
      <div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>{tr("video_quiz_matching_header", { n: index + 1, total })}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 18 }}
          dangerouslySetInnerHTML={{ __html: question.content }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opts.map((opt) => {
            const key = opt.matchKey ?? opt.id;
            const sel = pairs.find((p) => p.key === key)?.value ?? "";
            return (
              <div key={opt.id} style={{
                display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                border: `2px solid ${sel ? MLS_NAVY : "#E5E7EB"}`,
                background: sel ? "#EFF6FF" : "#FAFAFA",
              }}>
                <span style={{ fontSize: 14, color: "#111827", fontWeight: 500 }}>{opt.content}</span>
                <span style={{ color: "#9CA3AF", fontSize: 18, userSelect: "none" }}>↔</span>
                <select value={sel} onChange={(e) => setMatch(key, e.target.value)} style={{
                  padding: "6px 10px", borderRadius: 8, fontSize: 13,
                  border: `1px solid ${sel ? MLS_NAVY : "#D1D5DB"}`,
                  background: "#fff", color: "#111827", cursor: "pointer", outline: "none",
                }}>
                  <option value="">{tr("video_quiz_matching_select")}</option>
                  {allValues.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Ordering
  if (question.type === "Ordering") {
    let order: string[] = [];
    try { order = answer ? JSON.parse(answer) : []; } catch { order = []; }
    const orderedOpts = order.length === opts.length
      ? order.map((oid) => opts.find((o) => o.id === oid)).filter((o): o is NonNullable<typeof o> => o != null)
      : [...opts].sort((a, b) => a.displayOrder - b.displayOrder);
    const move = (fromIdx: number, direction: -1 | 1) => {
      const toIdx = fromIdx + direction;
      if (toIdx < 0 || toIdx >= orderedOpts.length) return;
      const next = [...orderedOpts];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      onChange(JSON.stringify(next.map((o) => o.id)));
    };
    return (
      <div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>{tr("video_quiz_ordering_header", { n: index + 1, total })}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 18 }}
          dangerouslySetInnerHTML={{ __html: question.content }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {orderedOpts.map((opt, i) => (
            <div key={opt.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
              border: `2px solid ${MLS_NAVY}22`, background: "#F8FAFF",
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: MLS_NAVY, color: "#fff", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14, color: "#111827" }}>{opt.content}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={{
                  padding: "2px 7px", borderRadius: 5, border: "1px solid #D1D5DB",
                  background: i === 0 ? "#F3F4F6" : "#fff", cursor: i === 0 ? "default" : "pointer",
                  fontSize: 10, color: i === 0 ? "#9CA3AF" : "#374151", lineHeight: 1,
                }}>▲</button>
                <button onClick={() => move(i, 1)} disabled={i === orderedOpts.length - 1} style={{
                  padding: "2px 7px", borderRadius: 5, border: "1px solid #D1D5DB",
                  background: i === orderedOpts.length - 1 ? "#F3F4F6" : "#fff",
                  cursor: i === orderedOpts.length - 1 ? "default" : "pointer",
                  fontSize: 10, color: i === orderedOpts.length - 1 ? "#9CA3AF" : "#374151", lineHeight: 1,
                }}>▼</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // SingleChoice / TrueFalse
  return (
    <div>
      <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>{tr("video_quiz_q_counter", { n: index + 1, total })}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 18 }}
        dangerouslySetInnerHTML={{ __html: question.content }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {opts.map((opt) => {
          const chosen = answer === opt.id;
          return (
            <button key={opt.id} onClick={() => onChange(chosen ? "" : opt.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
              border: `2px solid ${chosen ? MLS_NAVY : "#E5E7EB"}`,
              background: chosen ? "#EFF6FF" : "#FAFAFA", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${chosen ? MLS_NAVY : "#D1D5DB"}`,
                background: chosen ? MLS_NAVY : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {chosen && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
              </div>
              <span style={{ fontSize: 14, color: "#111827" }}>{opt.content}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}