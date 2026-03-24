"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { isInAppBrowser, getInAppBrowserName, openInExternalBrowser } from "@/lib/in-app-browser";

/** 인앱 브라우저에서 결제 시 외부 브라우저 안내 배너 */
export default function InAppBrowserBanner() {
  const [show, setShow] = useState(false);
  const [browserName, setBrowserName] = useState<string | null>(null);

  useEffect(() => {
    if (isInAppBrowser()) {
      setShow(true);
      setBrowserName(getInAppBrowserName());
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-amber-500/95 text-black safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {browserName ? `${browserName} 앱` : "인앱 브라우저"}에서는 결제가 제한될 수 있습니다
          </p>
          <p className="text-xs mt-0.5 opacity-80">
            외부 브라우저에서 열면 안전하게 결제할 수 있어요
          </p>
        </div>
        <button
          onClick={() => openInExternalBrowser()}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-medium"
        >
          <ExternalLink size={14} />
          외부 브라우저로 열기
        </button>
      </div>
    </div>
  );
}
