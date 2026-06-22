"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { Upload, ShieldCheck, X, Check, AlertCircle } from "lucide-react";

interface ClientMeta {
  id: string;
  businessName: string;
  contactPerson: string | null;
}
interface TokenMeta {
  expiresAt: string;
}

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
};

type Phase = "loading" | "valid" | "invalid" | "uploaded";

export default function AgencyPortalUploadPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [phase, setPhase] = useState<Phase>("loading");
  const [invalidStatus, setInvalidStatus] = useState<string>("");
  const [client, setClient] = useState<ClientMeta | null>(null);
  const [tokenMeta, setTokenMeta] = useState<TokenMeta | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ count: number; weekOfDate: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/portal/agency/${token}`);
        const j = await r.json();
        if (!r.ok) {
          setPhase("invalid");
          setInvalidStatus(j.status || "unknown");
          return;
        }
        setClient(j.client);
        setTokenMeta(j.token);
        setPhase("valid");
      } catch (e) {
        setPhase("invalid");
        setInvalidStatus("network_error");
      }
    })();
  }, [token]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted].slice(0, 30));
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxFiles: 30,
  });

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (files.length === 0) {
      setError("사진을 1장 이상 첨부해주세요");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setProgress("이미지 압축 중…");
      const compressed: File[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`이미지 압축 중 (${i + 1}/${files.length})…`);
        const c = await imageCompression(files[i], COMPRESSION_OPTIONS);
        // 압축 결과가 File이 아닌 Blob일 수 있어 명시적으로 File로 래핑
        compressed.push(new File([c], files[i].name, { type: c.type || files[i].type }));
      }

      setProgress("업로드 중…");
      const fd = new FormData();
      compressed.forEach((f) => fd.append("files", f));
      if (notes.trim()) fd.append("notes", notes.trim());

      const r = await fetch(`/api/portal/agency/${token}/upload`, {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "업로드 실패");

      setUploadResult({ count: j.upload.imageUrls.length, weekOfDate: j.upload.weekOfDate });
      setFiles([]);
      setNotes("");
      setPhase("uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--muted)]">
        토큰 확인 중…
      </div>
    );
  }

  if (phase === "invalid") {
    const messages: Record<string, string> = {
      not_found: "유효하지 않은 링크입니다. 담당 매니저에게 새 링크를 요청해주세요.",
      expired: "약정 기간이 종료되어 링크가 만료되었습니다.",
      revoked: "이 링크는 폐기되었습니다. 담당 매니저에게 문의해주세요.",
      rotated: "이 링크는 새 링크로 교체되었습니다. 카카오 알림톡으로 받은 최신 링크를 사용해주세요.",
      network_error: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--border)] text-center space-y-3">
          <AlertCircle size={40} className="mx-auto text-red-500" />
          <h1 className="text-lg font-bold">링크를 사용할 수 없습니다</h1>
          <p className="text-sm text-[var(--muted)]">
            {messages[invalidStatus] || "알 수 없는 오류가 발생했습니다."}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "uploaded" && uploadResult) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--green)]/40 bg-[var(--green)]/5 text-center space-y-3">
          <Check size={40} className="mx-auto text-[var(--green)]" />
          <h1 className="text-lg font-bold">업로드 완료</h1>
          <p className="text-sm text-[var(--muted)]">
            {uploadResult.weekOfDate} 주차 사진 {uploadResult.count}장이 전달되었습니다.
          </p>
          <button
            onClick={() => {
              setPhase("valid");
              setUploadResult(null);
            }}
            className="px-4 py-2 rounded-xl bg-[var(--green)] text-white text-sm"
          >
            추가 업로드
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--green)]/10 text-[var(--green)] text-xs">
            <ShieldCheck size={14} /> 클라이언트 전용
          </div>
          <h1 className="text-2xl font-bold mt-3">이번주 시공 사진 업로드</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {client?.businessName}
            {tokenMeta && (
              <span className="text-xs ml-2">
                · 약정 종료일: {new Date(tokenMeta.expiresAt).toISOString().slice(0, 10)}
              </span>
            )}
          </p>
        </header>

        {error && (
          <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div
          {...getRootProps()}
          className={`p-10 rounded-2xl border-2 border-dashed text-center cursor-pointer transition ${
            isDragActive
              ? "border-[var(--green)] bg-[var(--green)]/5"
              : "border-[var(--border)] hover:border-[var(--green)]/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={32} className="mx-auto text-[var(--muted)] mb-3" />
          <p className="text-sm text-[var(--muted)] mb-1">
            {isDragActive ? "여기에 놓으세요" : "사진을 드래그하거나 클릭해서 선택"}
          </p>
          <p className="text-xs text-[var(--muted)]">JPG/PNG/WEBP/HEIC · 최대 30장 · 자동 압축</p>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">선택된 사진 {files.length}장</p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-[var(--border)] aspect-square">
                  <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    disabled={busy}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="block">
          <span className="block text-xs text-[var(--muted)] mb-1">노트 (선택)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="예: 거실 도장 마감, 주방 타일 시공 완료"
            disabled={busy}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
          />
        </label>

        <button
          onClick={submit}
          disabled={busy || files.length === 0}
          className="w-full py-3 rounded-2xl bg-[var(--green)] text-white font-semibold disabled:opacity-50"
        >
          {busy ? progress || "처리 중…" : `사진 ${files.length}장 업로드`}
        </button>

        <div className="p-4 rounded-xl bg-[var(--sidebar)] text-xs text-[var(--muted)] space-y-1">
          <p>· 약정 기간 동안 유효한 단일 토큰입니다. 같은 링크를 매주 받게 됩니다.</p>
          <p>· 업로드된 사진은 180일간 보관되며 이후 자동 삭제됩니다.</p>
          <p>· 토큰을 분실했다면 담당 매니저에게 문의해 강제 회전을 요청하세요.</p>
        </div>
      </div>
    </div>
  );
}
