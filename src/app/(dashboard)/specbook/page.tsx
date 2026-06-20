"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList, Plus, Copy, Layers, Link2, Save, RefreshCw,
  ChevronDown, ChevronRight, Trash2, Image as ImageIcon, X, Check,
  Eye, EyeOff, FileDown, Pencil, FolderPlus,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  SpecbookCatalogData, SpecCategory, SpecOption, SubmissionSelection,
} from "@/lib/specbook";

interface Site { id: string; name: string; address?: string | null }
interface Submission {
  id: string;
  siteId: string;
  siteName?: string | null;
  customerName: string;
  customerSite: string | null;
  customerPhone: string | null;
  selections: SubmissionSelection[];
  status: "new" | "confirmed";
  memo: string | null;
  createdAt: string;
}
interface Template {
  id: string; name: string; description: string | null;
  isDefault: boolean; createdAt: string;
}

function uid() { return Math.random().toString(36).slice(2, 10); }
function fmtKrw(n?: number) { return typeof n === "number" ? `₩${n.toLocaleString()}` : "—"; }

export default function SpecbookPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string>("");
  const [catalog, setCatalog] = useState<SpecbookCatalogData | null>(null);
  const [catalogExists, setCatalogExists] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showAllSites, setShowAllSites] = useState(false);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [editingOption, setEditingOption] = useState<{ catId: string; option: SpecOption | null } | null>(null);

  // 1) 사이트 목록 로드
  useEffect(() => {
    apiFetch("/api/sites")
      .then((r) => r.json())
      .then((d) => {
        const list: Site[] = Array.isArray(d) ? d : d?.items ?? [];
        setSites(list);
        if (list[0] && !siteId) setSiteId(list[0].id);
      })
      .catch(() => {});
    apiFetch("/api/specbook/templates")
      .then((r) => r.json())
      .then((d) => {
        const list: Template[] = Array.isArray(d) ? d : d?.data ?? [];
        setTemplates(list);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) 선택한 현장의 카탈로그 로드
  const loadCatalog = useCallback(async (sid: string) => {
    setCatalogLoading(true);
    setShareUrl(null);
    try {
      const res = await apiFetch(`/api/specbook/sites/${sid}/catalog`);
      const j = await res.json();
      const payload = j?.data ?? j;
      setCatalog(payload.catalog ?? null);
      setCatalogExists(!!payload.exists);
      setActiveCatId(payload.catalog?.categories?.[0]?.id ?? null);
      setDirty(false);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => { if (siteId) loadCatalog(siteId); }, [siteId, loadCatalog]);

  // 3) 제출 목록 로드
  const loadSubmissions = useCallback(async () => {
    const qs = showAllSites ? "" : siteId ? `?siteId=${siteId}` : "";
    if (!showAllSites && !siteId) { setSubmissions([]); return; }
    const res = await apiFetch(`/api/specbook/submissions${qs}`);
    const j = await res.json();
    const list: Submission[] = Array.isArray(j) ? j : j?.data ?? [];
    setSubmissions(list);
  }, [siteId, showAllSites]);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  // 시작 옵션 (빈 카탈로그)
  async function initEmpty() {
    if (!siteId) return;
    const res = await apiFetch(`/api/specbook/sites/${siteId}/catalog/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) await loadCatalog(siteId);
    else alert("초기화 실패");
  }
  async function initFromTemplate(templateId: string) {
    if (!siteId) return;
    const res = await apiFetch(`/api/specbook/sites/${siteId}/catalog/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    });
    if (res.ok) await loadCatalog(siteId);
    else alert("템플릿 복사 실패");
  }
  async function initFromSite(fromSiteId: string) {
    if (!siteId) return;
    const res = await apiFetch(`/api/specbook/sites/${siteId}/catalog/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromSiteId }),
    });
    if (res.ok) await loadCatalog(siteId);
    else alert("복제 실패");
  }

  // 카탈로그 변경
  const setCat = (next: SpecbookCatalogData) => { setCatalog(next); setDirty(true); };
  const addCategory = () => {
    const name = prompt("공종 이름")?.trim();
    if (!name || !catalog) return;
    setCat({ ...catalog, categories: [...catalog.categories, { id: uid(), name, options: [] }] });
  };
  const renameCategory = (catId: string) => {
    if (!catalog) return;
    const cur = catalog.categories.find((c) => c.id === catId);
    const name = prompt("공종 이름", cur?.name)?.trim();
    if (!name) return;
    setCat({ ...catalog, categories: catalog.categories.map((c) => c.id === catId ? { ...c, name } : c) });
  };
  const deleteCategory = (catId: string) => {
    if (!catalog) return;
    if (!confirm("이 공종과 모든 자재를 삭제할까요?")) return;
    setCat({ ...catalog, categories: catalog.categories.filter((c) => c.id !== catId) });
    if (activeCatId === catId) setActiveCatId(catalog.categories.find((c) => c.id !== catId)?.id ?? null);
  };

  const upsertOption = (catId: string, opt: SpecOption) => {
    if (!catalog) return;
    setCat({
      ...catalog,
      categories: catalog.categories.map((c) =>
        c.id !== catId ? c : {
          ...c,
          options: c.options.find((o) => o.id === opt.id)
            ? c.options.map((o) => (o.id === opt.id ? opt : o))
            : [...c.options, opt],
        },
      ),
    });
  };
  const deleteOption = (catId: string, optId: string) => {
    if (!catalog || !confirm("이 자재를 삭제할까요?")) return;
    setCat({
      ...catalog,
      categories: catalog.categories.map((c) => c.id !== catId ? c : { ...c, options: c.options.filter((o) => o.id !== optId) }),
    });
  };

  // 저장
  async function saveCatalog() {
    if (!siteId || !catalog) return;
    setSaving(true);
    const res = await apiFetch(`/api/specbook/sites/${siteId}/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catalog),
    });
    setSaving(false);
    if (res.ok) { setDirty(false); setCatalogExists(true); }
    else alert("저장 실패");
  }

  // 공유 링크
  async function issueShare() {
    if (!siteId) return;
    const res = await apiFetch(`/api/specbook/sites/${siteId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const j = await res.json();
    const d = j?.data ?? j;
    if (d?.url) {
      setShareUrl(d.url);
      try { await navigator.clipboard.writeText(d.url); setShareToast(true); setTimeout(() => setShareToast(false), 2500); } catch {}
    } else alert("발급 실패");
  }

  // 템플릿으로 저장
  async function saveAsTemplate() {
    if (!siteId) return;
    const name = prompt("템플릿 이름")?.trim();
    if (!name) return;
    const description = prompt("설명 (선택)")?.trim() || undefined;
    const res = await apiFetch(`/api/specbook/templates/from-site/${siteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      // 템플릿 목록 갱신
      const r2 = await apiFetch("/api/specbook/templates");
      const list = await r2.json();
      setTemplates(Array.isArray(list) ? list : list?.data ?? []);
      alert("템플릿으로 저장 완료");
    } else alert("저장 실패");
  }

  // 제출 상태 변경
  async function toggleConfirm(sub: Submission) {
    const next = sub.status === "confirmed" ? "new" : "confirmed";
    const res = await apiFetch(`/api/specbook/submissions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) loadSubmissions();
  }
  async function deleteSubmission(id: string) {
    if (!confirm("이 제출을 삭제할까요?")) return;
    const res = await apiFetch(`/api/specbook/submissions/${id}`, { method: "DELETE" });
    if (res.ok) loadSubmissions();
  }

  const activeCat = useMemo(
    () => catalog?.categories.find((c) => c.id === activeCatId) ?? null,
    [catalog, activeCatId],
  );
  const otherSites = useMemo(() => sites.filter((s) => s.id !== siteId), [sites, siteId]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 헤더 + 현장 선택 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList size={22} className="text-[var(--green)]" />
            스펙북
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            현장별 자재 카탈로그를 만들고 고객이 직접 선택할 수 있도록 링크를 공유하세요.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
            현장
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--green)]/60 min-w-[200px]"
            >
              {sites.length === 0 && <option value="">현장 없음</option>}
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <button
            onClick={() => loadCatalog(siteId)}
            disabled={!siteId || catalogLoading}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-white/[0.04] disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw size={14} className={catalogLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {!siteId ? (
        <EmptyHint
          title="현장을 먼저 등록하세요"
          desc="현장 관리에서 시공 현장을 등록한 뒤 스펙북을 작성할 수 있습니다."
        />
      ) : !catalog ? null : !catalogExists ? (
        <StartChoices
          onEmpty={initEmpty}
          onFromSite={initFromSite}
          onFromTemplate={initFromTemplate}
          otherSites={otherSites}
          templates={templates}
        />
      ) : (
        <>
          {/* 도구바 */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={saveCatalog} disabled={!dirty || saving}
              className={cn("px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5",
                dirty ? "bg-[var(--green)] text-black hover:bg-[var(--green-hover)]" : "border border-[var(--border)] text-[var(--muted)]")}
            >
              <Save size={14} /> {saving ? "저장 중..." : dirty ? "저장" : "저장됨"}
            </button>
            <button onClick={issueShare}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.04] flex items-center gap-1.5"
            >
              <Link2 size={14} /> 공유링크 발급
            </button>
            <button onClick={saveAsTemplate}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.04] flex items-center gap-1.5"
            >
              <FolderPlus size={14} /> 템플릿으로 저장
            </button>
            <button onClick={addCategory}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.04] flex items-center gap-1.5"
            >
              <Plus size={14} /> 공종 추가
            </button>
          </div>

          {shareUrl && (
            <div className="rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/5 p-3 flex items-center gap-3 text-sm">
              <Link2 size={14} className="text-[var(--green)]" />
              <code className="flex-1 truncate text-[var(--green)]">{shareUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); setShareToast(true); setTimeout(() => setShareToast(false), 2000); }}
                className="px-2 py-1 rounded bg-[var(--green)]/10 text-[var(--green)] text-xs hover:bg-[var(--green)]/15">
                {shareToast ? "복사됨" : "복사"}
              </button>
            </div>
          )}

          {/* 공종 탭 + 자재 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
            <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
              <ul className="space-y-1">
                {catalog.categories.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveCatId(c.id)}
                      className={cn("w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 group",
                        activeCatId === c.id
                          ? "bg-[var(--green)]/10 text-[var(--green)]"
                          : "hover:bg-white/[0.04]")}
                    >
                      <span className="truncate">{c.icon ?? "•"} {c.name}</span>
                      <span className="text-xs text-[var(--muted)] flex-shrink-0">{c.options.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {catalog.categories.length === 0 && (
                <p className="text-xs text-[var(--muted)] text-center py-4">공종이 없습니다</p>
              )}
            </aside>

            <main>
              {activeCat ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold flex items-center gap-2">
                      {activeCat.icon ?? "•"} {activeCat.name}
                      <span className="text-xs text-[var(--muted)] font-normal">({activeCat.options.length})</span>
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => renameCategory(activeCat.id)} className="p-1.5 rounded hover:bg-white/[0.04]" title="이름 변경">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteCategory(activeCat.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400" title="공종 삭제">
                        <Trash2 size={13} />
                      </button>
                      <button onClick={() => setEditingOption({ catId: activeCat.id, option: null })}
                        className="px-3 py-1.5 rounded-lg bg-[var(--green)]/10 text-[var(--green)] text-xs font-medium hover:bg-[var(--green)]/15 flex items-center gap-1">
                        <Plus size={12} /> 자재 추가
                      </button>
                    </div>
                  </div>

                  {activeCat.options.length === 0 ? (
                    <p className="text-sm text-[var(--muted)] text-center py-10">
                      자재 옵션을 추가하면 고객이 선택할 수 있습니다.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeCat.options.map((opt) => (
                        <OptionCard
                          key={opt.id}
                          option={opt}
                          onEdit={() => setEditingOption({ catId: activeCat.id, option: opt })}
                          onDelete={() => deleteOption(activeCat.id, opt.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyHint title="공종을 선택하세요" desc="좌측에서 공종을 선택하거나 '공종 추가'로 새로 만드세요." />
              )}
            </main>
          </div>
        </>
      )}

      {/* 고객 제출 */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">고객 제출 ({submissions.length})</h2>
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <input type="checkbox" checked={showAllSites} onChange={(e) => setShowAllSites(e.target.checked)} />
            전체 현장 보기
          </label>
        </div>
        {submissions.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-10 text-center text-sm text-[var(--muted)]">
            아직 받은 제출이 없습니다. 공유링크를 발급하여 고객에게 전달하세요.
          </p>
        ) : (
          <div className="space-y-2">
            {submissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                sub={sub}
                expanded={expandedSub === sub.id}
                onToggle={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                onConfirm={() => toggleConfirm(sub)}
                onDelete={() => deleteSubmission(sub.id)}
                showSiteName={showAllSites}
              />
            ))}
          </div>
        )}
      </section>

      {/* 자재 편집 모달 */}
      {editingOption && (
        <OptionEditor
          catId={editingOption.catId}
          option={editingOption.option}
          onSave={(opt) => { upsertOption(editingOption.catId, opt); setEditingOption(null); }}
          onClose={() => setEditingOption(null)}
        />
      )}
    </div>
  );
}

// ────────── 시작 옵션 ──────────
function StartChoices({
  onEmpty, onFromSite, onFromTemplate, otherSites, templates,
}: {
  onEmpty: () => void;
  onFromSite: (siteId: string) => void;
  onFromTemplate: (templateId: string) => void;
  otherSites: Site[];
  templates: Template[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
      <h2 className="text-lg font-semibold mb-1">스펙북을 시작하세요</h2>
      <p className="text-sm text-[var(--muted)] mb-6">이 현장에 적용할 카탈로그를 어떻게 만들까요?</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={onEmpty}
          className="text-left p-5 rounded-xl border border-[var(--border)] hover:border-[var(--green)]/40 hover:bg-[var(--green)]/5 transition-colors">
          <Plus size={20} className="text-[var(--green)] mb-3" />
          <h3 className="font-semibold mb-1">빈 카탈로그로 시작</h3>
          <p className="text-xs text-[var(--muted)]">10개 기본 공종이 비어 있는 상태로 시작합니다.</p>
        </button>

        <div className="p-5 rounded-xl border border-[var(--border)]">
          <Copy size={20} className="text-[var(--green)] mb-3" />
          <h3 className="font-semibold mb-1">다른 현장에서 복제</h3>
          <p className="text-xs text-[var(--muted)] mb-3">기존 현장의 카탈로그를 가져옵니다.</p>
          {otherSites.length === 0 ? (
            <p className="text-xs text-[var(--muted)]/70">복제 가능한 다른 현장이 없습니다.</p>
          ) : (
            <select
              onChange={(e) => { if (e.target.value) onFromSite(e.target.value); }}
              defaultValue=""
              className="w-full px-2 py-1.5 rounded bg-transparent border border-[var(--border)] text-xs"
            >
              <option value="">현장 선택...</option>
              {otherSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)]">
          <Layers size={20} className="text-[var(--green)] mb-3" />
          <h3 className="font-semibold mb-1">기본 템플릿에서 시작</h3>
          <p className="text-xs text-[var(--muted)] mb-3">저장된 템플릿을 불러옵니다.</p>
          {templates.length === 0 ? (
            <p className="text-xs text-[var(--muted)]/70">저장된 템플릿이 없습니다.</p>
          ) : (
            <select
              onChange={(e) => { if (e.target.value) onFromTemplate(e.target.value); }}
              defaultValue=""
              className="w-full px-2 py-1.5 rounded bg-transparent border border-[var(--border)] text-xs"
            >
              <option value="">템플릿 선택...</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-[var(--muted)]">{desc}</p>
    </div>
  );
}

// ────────── 자재 옵션 카드 ──────────
function OptionCard({ option, onEdit, onDelete }: { option: SpecOption; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-3 bg-white/[0.02] flex gap-3">
      <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden bg-white/[0.04]"
        style={option.color ? { backgroundColor: option.color } : undefined}>
        {option.imageUrl
          ? <img src={option.imageUrl} alt={option.name} className="w-full h-full object-cover" />
          : option.color
            ? null
            : <ImageIcon size={20} className="text-[var(--muted)]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="font-medium text-sm truncate">{option.name}</div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1 rounded hover:bg-white/[0.04]" title="편집">
              <Pencil size={12} />
            </button>
            <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/10 text-red-400" title="삭제">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {(option.brand || option.model) && (
          <div className="text-xs text-[var(--muted)] truncate">
            {[option.brand, option.model].filter(Boolean).join(" · ")}
          </div>
        )}
        {option.spec && <div className="text-xs text-[var(--muted)] truncate">{option.spec}</div>}
        {typeof option.price === "number" && (
          <div className="text-xs font-medium text-[var(--green)] mt-0.5">{fmtKrw(option.price)}</div>
        )}
      </div>
    </div>
  );
}

// ────────── 옵션 편집 모달 ──────────
function OptionEditor({ option, onSave, onClose }: {
  catId: string;
  option: SpecOption | null;
  onSave: (opt: SpecOption) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<SpecOption>(option ?? {
    id: uid(), name: "", brand: "", model: "", spec: "", price: undefined, memo: "", imageUrl: "", color: "",
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="min-h-full flex items-start sm:items-center justify-center p-4">
        <div
          className="bg-[var(--background)] border border-[var(--border)] rounded-2xl w-full max-w-lg my-8 shadow-2xl shadow-black/50 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="sticky top-0 z-10 bg-[var(--background)] flex items-center justify-between px-6 py-4 border-b border-[var(--border)] rounded-t-2xl">
            <h3 className="font-semibold">{option ? "자재 편집" : "자재 추가"}</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.04]" aria-label="닫기">
              <X size={16} />
            </button>
          </div>

          {/* 본문 */}
          <div className="px-6 py-5 space-y-3">
          <Field label="자재명 *" required>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 강마루 SPC"
              className="w-full px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--green)]/60" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="브랜드">
              <input value={form.brand ?? ""} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
            </Field>
            <Field label="모델명">
              <input value={form.model ?? ""} onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
            </Field>
          </div>
          <Field label="규격/색상">
            <input value={form.spec ?? ""} onChange={(e) => setForm({ ...form, spec: e.target.value })}
              placeholder="예: 1220×190×8mm, 메이플 색상"
              className="w-full px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
          </Field>
          <Field label="가격 (원)">
            <input type="number" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value === "" ? undefined : Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
          </Field>
          <Field label="비고">
            <textarea value={form.memo ?? ""} onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
          </Field>

          {/* 이미지: URL 또는 대표색상 */}
          <div className="border border-[var(--border)] rounded-xl p-3 space-y-3 bg-white/[0.02]">
            <p className="text-xs text-[var(--muted)]">이미지 (URL 또는 대표색상 중 선택)</p>
            <Field label="이미지 URL">
              <input value={form.imageUrl ?? ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value, color: e.target.value ? "" : form.color })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
            </Field>
            <Field label="또는 대표색상">
              <div className="flex items-center gap-2">
                <input type="color" value={form.color || "#000000"} onChange={(e) => setForm({ ...form, color: e.target.value, imageUrl: e.target.value ? "" : form.imageUrl })}
                  className="w-10 h-10 rounded border border-[var(--border)] cursor-pointer" />
                <input value={form.color ?? ""} onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#RRGGBB"
                  className="flex-1 px-3 py-2 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
              </div>
            </Field>
            {/* 미리보기 */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--muted)]">미리보기</span>
              <div className="w-12 h-12 rounded-lg border border-[var(--border)] overflow-hidden"
                style={form.color && !form.imageUrl ? { backgroundColor: form.color } : undefined}>
                {form.imageUrl && <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />}
              </div>
            </div>
          </div>
          </div>

          {/* 푸터 (sticky) */}
          <div className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--border)] px-6 py-4 flex justify-end gap-2 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.04]">취소</button>
            <button
              onClick={() => { if (!form.name.trim()) { alert("자재명을 입력해주세요"); return; } onSave(form); }}
              className="px-4 py-2 rounded-lg bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)]"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-[var(--muted)] mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</span>
      {children}
    </label>
  );
}

// ────────── 제출 카드 ──────────
function SubmissionCard({
  sub, expanded, onToggle, onConfirm, onDelete, showSiteName,
}: {
  sub: Submission;
  expanded: boolean;
  onToggle: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  showSiteName: boolean;
}) {
  const dateStr = new Date(sub.createdAt).toLocaleString("ko-KR", {
    year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const isConfirmed = sub.status === "confirmed";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center gap-3 text-left">
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{sub.customerName}</span>
            {showSiteName && sub.siteName && (
              <span className="text-xs text-[var(--muted)]">@ {sub.siteName}</span>
            )}
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              isConfirmed ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-amber-500/10 text-amber-400")}>
              {isConfirmed ? "확인됨" : "신규"}
            </span>
          </div>
          <div className="text-xs text-[var(--muted)]">
            {sub.customerSite ?? ""} · 선택 {sub.selections.length}건 · {dateStr}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-3 space-y-3">
          {/* 공종별 그룹화 */}
          {(() => {
            const groups = new Map<string, { name: string; items: SubmissionSelection[] }>();
            for (const s of sub.selections) {
              const g = groups.get(s.categoryId) ?? { name: s.categoryName, items: [] };
              g.items.push(s);
              groups.set(s.categoryId, g);
            }
            return Array.from(groups.entries()).map(([cid, g]) => (
              <div key={cid}>
                <h4 className="text-xs text-[var(--muted)] font-medium mb-1">{g.name}</h4>
                <div className="space-y-1">
                  {g.items.map((it) => (
                    <div key={it.optionId} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                      <div className="w-9 h-9 rounded flex-shrink-0 overflow-hidden bg-white/[0.04]"
                        style={it.color && !it.imageUrl ? { backgroundColor: it.color } : undefined}>
                        {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{it.optionName}</div>
                        <div className="text-xs text-[var(--muted)] truncate">
                          {[it.brand, it.model].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                      {typeof it.price === "number" && (
                        <span className="text-xs text-[var(--green)] flex-shrink-0">{fmtKrw(it.price)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          {sub.customerPhone && (
            <p className="text-xs text-[var(--muted)]">연락처: {sub.customerPhone}</p>
          )}
          {sub.memo && (
            <p className="text-xs text-[var(--muted)] whitespace-pre-wrap">메모: {sub.memo}</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
            <button onClick={onConfirm} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1",
              isConfirmed ? "border border-[var(--border)] text-[var(--muted)]" : "bg-[var(--green)]/10 text-[var(--green)]")}>
              {isConfirmed ? <><EyeOff size={12} /> 신규로</> : <><Check size={12} /> 확인됨</>}
            </button>
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-white/[0.04] flex items-center gap-1">
              <FileDown size={12} /> PDF로 보기
            </button>
            <button onClick={onDelete} className="ml-auto px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-1">
              <Trash2 size={12} /> 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
