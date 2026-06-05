"use client";

import { useRef, useState, useEffect } from "react";

interface AudioQuestionPlayerProps {
  audioUrl: string;
  playLimit?: number;          // default 2
  onExhausted?: () => void;    // called when plays exhausted
}

export default function AudioQuestionPlayer({
  audioUrl,
  playLimit = 2,
  onExhausted,
}: AudioQuestionPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playsUsed, setPlaysUsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const exhausted = playsUsed >= playLimit;
  const remaining = playLimit - playsUsed;

  useEffect(() => {
    // Reset when URL changes (new question)
    setPlaysUsed(0);
    setIsPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [audioUrl]);

  const handlePlay = () => {
    if (exhausted || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    const used = playsUsed + 1;
    setPlaysUsed(used);
    if (used >= playLimit) onExhausted?.();
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
        onPlay={() => setIsPlaying(true)}
        onEnded={handleEnded}
      />

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-blue-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {/* Play button */}
        <button
          onClick={handlePlay}
          disabled={exhausted}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
            ${exhausted
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : isPlaying
                ? "bg-blue-100 text-blue-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {isPlaying ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-blue-600 animate-pulse" />
              Đang phát...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Nghe câu hỏi
            </>
          )}
        </button>

        {/* Play count indicator */}
        <div className={`flex items-center gap-1 text-sm font-medium ${exhausted ? "text-red-500" : "text-blue-600"}`}>
          {Array.from({ length: playLimit }).map((_, i) => (
            <span
              key={i}
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                i < playsUsed ? "bg-gray-300" : "bg-blue-500"
              }`}
            />
          ))}
          <span className="ml-1">
            {exhausted ? "Hết lượt" : `Còn ${remaining} lượt`}
          </span>
        </div>
      </div>

      {exhausted && (
        <p className="text-xs text-red-500">
          Bạn đã nghe hết {playLimit} lượt cho phép. Vui lòng trả lời câu hỏi.
        </p>
      )}
    </div>
  );
}
