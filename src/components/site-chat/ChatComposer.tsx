"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Paperclip, Send, X } from "lucide-react";

interface ChatComposerProps {
  onSend: (text: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatComposer({ onSend, disabled, placeholder = "메시지를 입력하세요..." }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setText("");
    setFiles([]);
    textRef.current?.focus();
  }, [text, files, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape" && files.length > 0) {
      setFiles([]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) setFiles(prev => [...prev, file]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/") || f.size < 10 * 1024 * 1024);
    if (droppedFiles.length > 0) setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div
      className="border-t border-[var(--border)] bg-white/[0.02]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {files.map((f, i) => (
            <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/[0.04] border border-[var(--border)]">
              {f.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                  <Paperclip size={16} />
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X size={8} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Camera button — mobile capture */}
        <button
          onClick={() => fileRef.current?.click()}
          className="shrink-0 p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
        >
          <Camera size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attach button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="shrink-0 p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
        >
          <Paperclip size={18} />
        </button>

        {/* Text input */}
        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none resize-none max-h-32 min-h-[36px]"
          style={{ height: "auto" }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 128) + "px";
          }}
        />

        {/* Send */}
        <button
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && files.length === 0)}
          className="shrink-0 p-2.5 rounded-xl bg-[var(--green)] text-black hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-[9px] text-[var(--muted)] text-center pb-2">Ctrl+Enter로 전송</p>
    </div>
  );
}
