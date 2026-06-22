"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X as XIcon, User, Phone, MapPin, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import StatusBadge from "@/components/ui/StatusBadge";

/** /api/customers/search 가 반환하는 최소 필드. 전체 상세는 selectedDetail 로 별도 조회. */
export interface CustomerSearchHit {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  address: string | null;
}

/** /api/customers/[id] 가 반환하는 풍부한 형태. picker 가 onSelect 로 넘김. */
export interface CustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  memo: string | null;
  status: string;
  sites?: Array<{
    id: string;
    name: string;
    address: string | null;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
  }>;
}

interface Props {
  /** 현재 선택된 고객 (null 이면 검색 가능 상태) */
  value: CustomerSearchHit | CustomerDetail | null;
  /** 고객 선택 시 호출. 클라이언트는 polled detail (sites 포함) 을 받음. */
  onSelect: (customer: CustomerDetail) => void;
  /** "해제" 클릭 시 호출 — value 를 null 로 비우면 됨. */
  onClear: () => void;
  /** placeholder 텍스트 */
  placeholder?: string;
  /** 상담중단/취소 등 특정 상태 제외 (기본 ["상담중단/취소"]) */
  excludeStatuses?: string[];
  /** picker 자체에 라벨 노출 여부 (기본 true) */
  showLabel?: boolean;
}

const DEBOUNCE_MS = 200;

export default function CustomerPicker({
  value,
  onSelect,
  onClear,
  placeholder = "이름·연락처로 검색",
  excludeStatuses = ["상담중단/취소"],
  showLabel = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CustomerSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 디바운스된 검색
  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query.trim(),
          limit: "8",
        });
        if (excludeStatuses.length > 0) {
          params.set("exclude", excludeStatuses.join(","));
        }
        const res = await apiFetch(`/api/customers/search?${params.toString()}`);
        if (!res.ok) {
          setHits([]);
          return;
        }
        const data = await res.json().catch(() => []);
        setHits(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handlePick = async (hit: CustomerSearchHit) => {
    setBusyId(hit.id);
    try {
      // 상세 조회 — sites 등 추가 정보 포함
      const res = await apiFetch(`/api/customers/${hit.id}`);
      if (res.ok) {
        const detail = (await res.json().catch(() => null)) as CustomerDetail | null;
        if (detail?.id) {
          onSelect(detail);
        } else {
          // fallback — hit 정보만으로 채움
          onSelect({
            id: hit.id,
            name: hit.name,
            phone: hit.phone,
            email: null,
            address: hit.address,
            memo: null,
            status: hit.status,
            sites: [],
          });
        }
      } else {
        onSelect({
          id: hit.id,
          name: hit.name,
          phone: hit.phone,
          email: null,
          address: hit.address,
          memo: null,
          status: hit.status,
          sites: [],
        });
      }
      setQuery("");
      setOpen(false);
    } finally {
      setBusyId(null);
    }
  };

  // 선택됨 상태 — 칩 표시
  if (value) {
    return (
      <div className="space-y-1.5">
        {showLabel && (
          <p className="text-[10px] font-semibold text-[var(--muted)]">연결된 고객</p>
        )}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--green)]/40 bg-[var(--green)]/5">
          <User size={14} className="text-[var(--green)] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold truncate">{value.name}</span>
              <StatusBadge status={value.status} />
            </div>
            <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
              {value.phone || "연락처 없음"}
              {value.address ? ` · ${value.address}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-1 rounded-lg text-[10px] text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors shrink-0"
            title="연결 해제"
          >
            해제
          </button>
        </div>
      </div>
    );
  }

  // 미선택 상태 — 검색 입력
  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {showLabel && (
        <p className="text-[10px] font-semibold text-[var(--muted)]">
          기존 고객 불러오기 (선택)
        </p>
      )}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] animate-spin pointer-events-none"
          />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setHits([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.06]"
            aria-label="검색어 지우기"
          >
            <XIcon size={12} />
          </button>
        )}
      </div>

      {/* 드롭다운 */}
      {open && query.trim() && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg max-h-72 overflow-y-auto">
          {hits.length === 0 ? (
            <p className="px-3 py-3 text-xs text-[var(--muted)] text-center">
              {loading ? "검색 중..." : `"${query}" 일치 고객 없음 — 아래 폼에 직접 입력하세요`}
            </p>
          ) : (
            <ul className="py-1">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(h)}
                    disabled={busyId !== null}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--green)]/10 transition-colors disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[var(--background)] flex items-center justify-center shrink-0">
                      <User size={12} className="text-[var(--muted)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{h.name}</span>
                        <StatusBadge status={h.status} />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] mt-0.5">
                        {h.phone && (
                          <span className="flex items-center gap-0.5">
                            <Phone size={10} />
                            {h.phone}
                          </span>
                        )}
                        {h.address && (
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin size={10} />
                            <span className="truncate">{h.address}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {busyId === h.id && (
                      <Loader2 size={12} className="animate-spin text-[var(--muted)] shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
