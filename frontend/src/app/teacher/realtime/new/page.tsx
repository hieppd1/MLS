"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateRoomMutation,
} from "@/lib/features/quiz/realtimeApi";
import { useListQuizzesQuery } from "@/lib/features/quiz/quizApi";

export default function TeacherRealtimeNewPage() {
  const router = useRouter();
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: quizList } = useListQuizzesQuery({ page: 1, pageSize: 50, status: "Published" });
  const [createRoom, { isLoading }] = useCreateRoomMutation();

  const handleCreate = async () => {
    if (!selectedQuizId) {
      setError("Vui lòng chọn bài quiz.");
      return;
    }
    try {
      const room = await createRoom({ quizId: selectedQuizId }).unwrap();
      // Store room code so host page can use it for SignalR
      sessionStorage.setItem("currentRoomCode", room.roomCode);
      router.push(`/teacher/realtime/${room.roomId}/host`);
    } catch {
      setError("Không thể tạo phòng. Vui lòng thử lại.");
    }
  };

  // Filter to only RealtimeQuiz type
  const realtimeQuizzes = quizList?.items?.filter(
    (q: { quizType: string; status: string }) => q.quizType === "RealtimeQuiz"
  ) ?? [];

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Tạo phòng Quiz thời gian thực</h1>
      <p className="text-gray-500 mb-8">Chọn bài quiz để tạo phòng. Học sinh sẽ tham gia bằng mã phòng.</p>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn bài quiz</label>
        <select
          value={selectedQuizId}
          onChange={(e) => { setSelectedQuizId(e.target.value); setError(null); }}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
        >
          <option value="">-- Chọn quiz --</option>
          {realtimeQuizzes.length === 0 && (
            <option value="" disabled>Chưa có quiz RealtimeQuiz nào được xuất bản</option>
          )}
          {realtimeQuizzes.map((q: { id: string; title: string }) => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>
        {realtimeQuizzes.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            Tip: Tạo quiz với loại &quot;RealtimeQuiz&quot; và xuất bản trước.
          </p>
        )}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={isLoading || !selectedQuizId}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-xl transition"
      >
        {isLoading ? "Đang tạo phòng..." : "🚀 Tạo phòng ngay"}
      </button>
    </div>
  );
}
