"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

interface ChangeRequestFormProps {
  onSubmit: (data: { category: string; title: string; description: string }) => Promise<void>;
}

const categories = [
  { value: "design_change", label: "디자인 변경" },
  { value: "material_change", label: "자재 변경" },
  { value: "schedule_change", label: "일정 변경" },
  { value: "defect_report", label: "하자 신고" },
  { value: "other", label: "기타 요청" },
];

export function ChangeRequestForm({ onSubmit }: ChangeRequestFormProps) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !title || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({ category, title, description });
      setSubmitted(true);
      setCategory("");
      setTitle("");
      setDescription("");
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitted && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>변경 요청이 성공적으로 접수되었습니다.</span>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          요청 유형
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          required
        >
          <option value="">유형을 선택하세요</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="요청 제목을 입력하세요"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          상세 내용
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="변경 요청 내용을 자세히 설명해 주세요"
          rows={4}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={!category || !title || submitting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-4 h-4" />
        {submitting ? "접수 중..." : "변경 요청 접수"}
      </button>
    </form>
  );
}
