"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useJoinRoomMutation } from "@/lib/features/quiz/realtimeApi";

export default function RealtimeJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joinRoom, { isLoading }] = useJoinRoomMutation();

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Vui lòng nhập mã phòng hợp lệ.");
      return;
    }
    try {
      const room = await joinRoom(trimmed).unwrap();
      router.push(`/realtime/${room.roomCode}/play`);
    } catch {
      setError("Không tìm thấy phòng. Kiểm tra lại mã và thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
        <div className="text-5xl mb-4">🎮</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Tham gia Quiz</h1>
        <p className="text-gray-500 mb-8">Nhập mã phòng do giáo viên cung cấp</p>

        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          placeholder="Mã phòng (VD: AB3X9K)"
          className="w-full text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-indigo-500 uppercase"
          maxLength={10}
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={isLoading || !code.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-lg py-3 rounded-xl transition"
        >
          {isLoading ? "Đang tham gia..." : "Tham gia ngay"}
        </button>
      </div>
    </div>
  );
}
