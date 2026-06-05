"use client";

interface MidAdjustScreenProps {
  currentDifficulty: number;
  onSelect: (choice: "easier" | "same" | "harder") => void;
  loading?: boolean;
}

const OPTIONS: { value: "easier" | "same" | "harder"; label: string; desc: string; icon: string }[] = [
  {
    value: "easier",
    label: "Dễ hơn",
    desc: "Giảm độ khó — câu hỏi quen thuộc hơn cho phần 2",
    icon: "↓",
  },
  {
    value: "same",
    label: "Giữ nguyên",
    desc: "Tiếp tục với mức độ hiện tại",
    icon: "→",
  },
  {
    value: "harder",
    label: "Khó hơn",
    desc: "Tăng thách thức — có cơ hội đạt level cao hơn",
    icon: "↑",
  },
];

export default function MidAdjustScreen({
  currentDifficulty,
  onSelect,
  loading = false,
}: MidAdjustScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10 text-center">
      <div className="max-w-md">
        <div className="mb-2 text-4xl">🎯</div>
        <h2 className="text-2xl font-bold text-gray-800">Bạn cảm thấy thế nào?</h2>
        <p className="mt-2 text-gray-500">
          Bạn đã hoàn thành 7 câu đầu tiên. Hãy chọn mức độ cho phần tiếp theo.
        </p>
        <p className="mt-1 text-sm text-blue-600 font-medium">
          Mức hiện tại: {currentDifficulty}/6
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            disabled={loading}
            className="flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-4
              text-left transition hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
              bg-blue-100 text-xl font-bold text-blue-600">
              {opt.icon}
            </span>
            <div>
              <p className="font-semibold text-gray-800">{opt.label}</p>
              <p className="text-sm text-gray-500">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
