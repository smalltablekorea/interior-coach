"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Copy, Check, Upload, X, ExternalLink } from "lucide-react";

const TONE_KEYWORDS = [
  "친근한", "전문적", "고급스러운", "젊은", "신뢰감", "위트있는", "정직한", "혁신적",
];
const CATEGORIES = [
  "아파트", "단독주택", "빌라", "오피스", "카페", "음식점", "스튜디오", "올수리", "부분공사",
];

interface ClientDetail {
  id: string;
  businessName: string;
  brandTone: { description?: string; keywords?: string[] } | null;
  targetAudience: string | null;
  categories: string[] | null;
  region: string | null;
  naverBlogUrl: string | null;
  threadsHandle: string | null;
  instagramBusinessId: string | null;
  contractStart: string | null;
  contractMonths: number;
  monthlyPrice: number;
}

interface BrandAsset {
  id: string;
  imageUrl: string;
  caption: string | null;
  uploadedAt: string;
}

export default function OnboardingPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toneDescription, setToneDescription] = useState("");
  const [toneKeywords, setToneKeywords] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/agency/clients/${clientId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "조회 실패");
      setClient(j.client);
      setAssets(j.brandAssets || []);
      setPortalUrl(j.portalUrl);
      setToneDescription(j.client?.brandTone?.description || "");
      setToneKeywords(j.client?.brandTone?.keywords || []);
      setCategories(j.client?.categories || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = (list: string[], val: string) =>
    list.includes(val) ? list.filter((x) => x !== val) : [...list, val];

  const save = async (form: FormData) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        brandTone: {
          description: toneDescription,
          keywords: toneKeywords,
        },
        targetAudience: form.get("targetAudience") || null,
        categories,
        region: form.get("region") || null,
        naverBlogUrl: form.get("naverBlogUrl") || null,
        threadsHandle: form.get("threadsHandle") || null,
        instagramBusinessId: form.get("instagramBusinessId") || null,
      };
      const r = await fetch(`/api/agency/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "저장 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const uploadAsset = async (file: File, caption: string) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("caption", caption);
      fd.append("type", "past_work");
      const r = await fetch(`/api/agency/clients/${clientId}/brand-assets`, {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "업로드 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  if (!client) {
    return <section className="p-6 text-sm text-[var(--muted)]">불러오는 중…</section>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {portalUrl && (
        <section className="p-5 rounded-2xl border border-[var(--green)]/40 bg-[var(--green)]/5">
          <h3 className="font-semibold text-sm mb-2">클라이언트 포털 URL</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-[var(--border)] text-xs break-all">
              {portalUrl}
            </code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(portalUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="px-3 py-2 rounded-lg bg-[var(--green)] text-white text-xs inline-flex items-center gap-1"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "복사됨" : "복사"}
            </button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs inline-flex items-center gap-1"
            >
              <ExternalLink size={14} /> 열기
            </a>
          </div>
        </section>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(new FormData(e.currentTarget));
        }}
        className="space-y-5"
      >
        <section className="p-5 rounded-2xl border border-[var(--border)] space-y-3">
          <h3 className="font-semibold text-sm">브랜드 톤</h3>
          <label className="block">
            <span className="block text-xs text-[var(--muted)] mb-1">자유 설명 (5~10문장 권장)</span>
            <textarea
              value={toneDescription}
              onChange={(e) => setToneDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
              placeholder="예: 친근하면서도 전문성을 잃지 않는 톤. 가격 투명성을 강조하고..."
            />
          </label>
          <div>
            <span className="block text-xs text-[var(--muted)] mb-2">톤 키워드 (multi-select)</span>
            <div className="flex flex-wrap gap-2">
              {TONE_KEYWORDS.map((k) => {
                const on = toneKeywords.includes(k);
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setToneKeywords(toggle(toneKeywords, k))}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      on
                        ? "bg-[var(--green)] text-white border-[var(--green)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="p-5 rounded-2xl border border-[var(--border)] space-y-3">
          <h3 className="font-semibold text-sm">타겟 / 카테고리 / 지역</h3>
          <label className="block">
            <span className="block text-xs text-[var(--muted)] mb-1">타겟 오디언스</span>
            <input
              name="targetAudience"
              defaultValue={client.targetAudience || ""}
              placeholder="예: 30~40대 신혼부부, 첫 자가 마련"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
            />
          </label>
          <div>
            <span className="block text-xs text-[var(--muted)] mb-2">시공 카테고리 (multi-select)</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const on = categories.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategories(toggle(categories, c))}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      on
                        ? "bg-[var(--green)] text-white border-[var(--green)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs text-[var(--muted)] mb-1">지역</span>
            <input
              name="region"
              defaultValue={client.region || ""}
              placeholder="예: 서울 강남"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
            />
          </label>
        </section>

        <section className="p-5 rounded-2xl border border-[var(--border)] space-y-3">
          <h3 className="font-semibold text-sm">채널 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-xs text-[var(--muted)] mb-1">네이버 블로그 URL</span>
              <input
                name="naverBlogUrl"
                defaultValue={client.naverBlogUrl || ""}
                placeholder="https://blog.naver.com/..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-[var(--muted)] mb-1">Threads handle</span>
              <input
                name="threadsHandle"
                defaultValue={client.threadsHandle || ""}
                placeholder="@handle"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-[var(--muted)] mb-1">Instagram business ID</span>
              <input
                name="instagramBusinessId"
                defaultValue={client.instagramBusinessId || ""}
                placeholder="178414..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-[var(--green)] text-white text-sm disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </form>

      <section className="p-5 rounded-2xl border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">과거 시공 사례 ({assets.length}/10건)</h3>
          <label className="px-3 py-2 rounded-lg bg-[var(--green)] text-white text-xs inline-flex items-center gap-1 cursor-pointer">
            <Upload size={14} />
            {uploading ? "업로드 중..." : "사진 추가"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading || assets.length >= 10}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const caption = prompt("이 시공 사례에 대한 한 줄 캡션을 입력하세요") || "";
                await uploadAsset(file, caption);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {assets.length === 0 ? (
          <p className="text-xs text-[var(--muted)] py-6 text-center">
            과거 시공 사례를 5~10건 업로드해 주세요. AI가 톤 학습에 사용합니다.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {assets.map((a) => (
              <div key={a.id} className="rounded-lg overflow-hidden border border-[var(--border)]">
                <img src={a.imageUrl} alt={a.caption || ""} className="w-full aspect-square object-cover" />
                <p className="px-2 py-1 text-xs text-[var(--muted)] truncate">{a.caption || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
