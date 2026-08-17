"use client";

import { useEffect, useState } from "react";
import { Megaphone, CheckCircle2, Users, FileCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

const APPLY_ENDPOINT = "https://www.interiorcoach.co.kr/api/apply";

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--green)] placeholder:text-[var(--muted)]";
const labelCls = "block text-xs font-medium text-[var(--muted)] mb-1.5";

export default function PlatformApplicationPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const [form, setForm] = useState({
    company: "",
    owner: "",
    phone: "",
    email: "",
    bizno: "",
    region: "",
    specialty: "",
    history: "",
    insurance: "",
    portfolio: "",
    intro: "",
  });
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appliedKey = workspace ? `platform_applied_${workspace.id}` : null;

  // 프로필/워크스페이스 정보로 프리필
  useEffect(() => {
    setForm((f) => ({
      ...f,
      company: f.company || workspace?.name || "",
      owner: f.owner || user?.name || "",
      email: f.email || user?.email || "",
      bizno: f.bizno || (workspace as { businessNumber?: string } | null)?.businessNumber || "",
    }));
  }, [user, workspace]);

  useEffect(() => {
    if (appliedKey && typeof window !== "undefined" && localStorage.getItem(appliedKey)) {
      setDone(true);
    }
  }, [appliedKey]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
    if (v.length > 7) v = `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7)}`;
    else if (v.length > 3) v = `${v.slice(0, 3)}-${v.slice(3)}`;
    setForm({ ...form, phone: v });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(APPLY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", source: "saas", ...form }),
      });
      const j = await res.json();
      if (j.ok) {
        if (appliedKey) localStorage.setItem(appliedKey, new Date().toISOString());
        setDone(true);
      } else {
        setError("제출에 실패했습니다. 필수 항목을 확인해주세요.");
      }
    } catch {
      setError("일시적인 오류입니다. 잠시 후 다시 시도해주세요.");
    }
    setSaving(false);
  };

  if (done) {
    return (
      <div className="space-y-6 animate-fade-up max-w-2xl">
        <h1 className="text-2xl font-bold">플랫폼 입점 신청</h1>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[var(--green)]" />
          <p className="text-lg font-bold mb-2">입점 신청이 접수됐습니다</p>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            본사가 6단계 기준으로 검토 후 <span className="text-[var(--foreground)] font-medium">2~3 영업일 내</span> 연락드립니다.
            <br />
            심사 결과와 관계없이 인테리어코치 프로그램은 계속 이용하실 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-[var(--green)]" />
          플랫폼 입점 신청
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          인테리어코치 소비자 매칭 플랫폼에 입점하면 검증된 고객을 연결받을 수 있습니다.
        </p>
      </div>

      {/* 혜택 요약 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Users, t: "검증된 고객 매칭", d: "지역·전문 분야에 맞는 실수요 고객 연결" },
          { icon: FileCheck, t: "표준 견적서", d: "본사 확인을 거쳐 신뢰도 있는 견적 전달" },
          { icon: ShieldCheck, t: "본사 조율 지원", d: "공정·추가 비용 이슈를 본사가 함께 조율" },
        ].map((b) => (
          <div key={b.t} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <b.icon className="h-5 w-5 text-[var(--green)] mb-2" />
            <p className="text-sm font-bold">{b.t}</p>
            <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{b.d}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>업체명 *</label>
            <input className={inputCls} value={form.company} onChange={set("company")} maxLength={60} required />
          </div>
          <div>
            <label className={labelCls}>대표자명 *</label>
            <input className={inputCls} value={form.owner} onChange={set("owner")} maxLength={30} required />
          </div>
          <div>
            <label className={labelCls}>연락처 *</label>
            <input className={inputCls} value={form.phone} onChange={handlePhone} inputMode="numeric" placeholder="010-0000-0000" required />
          </div>
          <div>
            <label className={labelCls}>이메일</label>
            <input className={inputCls} type="email" value={form.email} onChange={set("email")} maxLength={60} />
          </div>
          <div>
            <label className={labelCls}>사업자등록번호</label>
            <input className={inputCls} value={form.bizno} onChange={set("bizno")} maxLength={12} placeholder="000-00-00000" />
          </div>
          <div>
            <label className={labelCls}>활동 지역 *</label>
            <input className={inputCls} value={form.region} onChange={set("region")} maxLength={40} placeholder="예: 서울 전역, 경기 남부" required />
          </div>
          <div>
            <label className={labelCls}>전문 분야 *</label>
            <select className={inputCls} value={form.specialty} onChange={set("specialty")} required>
              <option value="">선택</option>
              <option>주거</option>
              <option>상가</option>
              <option>주거+상가</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>시공 이력 *</label>
            <select className={inputCls} value={form.history} onChange={set("history")} required>
              <option value="">선택</option>
              <option>10건 미만</option>
              <option>10~30건</option>
              <option>30~100건</option>
              <option>100건 이상</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>하자이행보험 가입 가능 여부 *</label>
            <select className={inputCls} value={form.insurance} onChange={set("insurance")} required>
              <option value="">선택</option>
              <option>가능</option>
              <option>불가능</option>
              <option>확인 필요</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>포트폴리오 링크</label>
            <input className={inputCls} value={form.portfolio} onChange={set("portfolio")} maxLength={300} placeholder="홈페이지 · 인스타 · 블로그" />
          </div>
        </div>
        <div>
          <label className={labelCls}>업체 소개</label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.intro}
            onChange={set("intro")}
            maxLength={1000}
            placeholder="주력 공사, 팀 규모, 자랑하고 싶은 현장 등을 자유롭게 적어주세요."
          />
        </div>
        <label className="flex items-start gap-2 text-xs text-[var(--muted)] leading-relaxed cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-[var(--green)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
          <span>
            <b className="text-[var(--foreground)]">[필수]</b> 개인정보 수집·이용 동의 — 항목: 업체·대표자·연락처·사업자정보 · 목적: 입점 심사
            및 안내 · 보유: 심사 종료 후 파기
          </span>
        </label>
        {error && <p className="text-sm text-[var(--red)]">{error}</p>}
        <button
          type="submit"
          disabled={saving || !agree}
          className="w-full py-3.5 rounded-xl bg-[var(--green)] text-black font-bold text-sm disabled:opacity-50 transition-opacity"
        >
          {saving ? "제출 중..." : "입점 신청 제출"}
        </button>
        <p className="text-xs text-[var(--muted)]">제출 후 영업일 기준 2~3일 내 심사 결과를 연락드립니다. 6단계 기준 미달 시 입점이 제한될 수 있습니다.</p>
      </form>
    </div>
  );
}
