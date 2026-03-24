"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";

// ─── 분석 카운터 + 최근 분석 알림 토스트 ───

const SAMPLE_LOCATIONS = [
  "서울 강남구", "서울 송파구", "서울 마포구", "서울 서초구", "서울 용산구",
  "경기 성남시", "경기 수원시", "경기 고양시", "경기 용인시", "경기 하남시",
  "인천 연수구", "인천 부평구", "부산 해운대구", "대구 수성구", "광주 서구",
];

const SAMPLE_TYPES = ["24평 아파트", "32평 아파트", "34평 아파트", "27평 빌라", "20평 오피스텔", "45평 아파트"];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMinutesAgo(): string {
  const min = Math.floor(Math.random() * 30) + 1;
  return `${min}분 전`;
}

interface Props {
  /** 총 분석 건수 (DB에서 가져온 실제 값 또는 기본값) */
  totalCount?: number;
}

export default function SocialProofWidget({ totalCount = 4827 }: Props) {
  const [toast, setToast] = useState<{ location: string; type: string; ago: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 5초 후 첫 토스트, 이후 30~60초 간격
    const showToast = () => {
      const data = {
        location: getRandomItem(SAMPLE_LOCATIONS),
        type: getRandomItem(SAMPLE_TYPES),
        ago: getRandomMinutesAgo(),
      };
      setToast(data);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };

    const initialTimer = setTimeout(showToast, 5000);
    const interval = setInterval(showToast, 35000 + Math.random() * 25000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* 실시간 분석 카운터 */}
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <BarChart3 size={14} className="text-[var(--green)]" />
        <span>
          지금까지 <strong className="text-[var(--foreground)]">{totalCount.toLocaleString()}</strong>건의 견적서가 분석되었습니다
        </span>
      </div>

      {/* 최근 분석 알림 토스트 */}
      {toast && (
        <div
          className={`fixed bottom-20 left-4 z-40 max-w-xs px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg transition-all duration-500 ${
            visible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          }`}
        >
          <p className="text-xs text-[var(--muted)]">
            <span className="text-[var(--foreground)] font-medium">{toast.location}</span>에서{" "}
            {toast.type} 견적 분석 완료
          </p>
          <p className="text-[10px] text-[var(--muted)]/60 mt-0.5">{toast.ago}</p>
        </div>
      )}
    </>
  );
}
