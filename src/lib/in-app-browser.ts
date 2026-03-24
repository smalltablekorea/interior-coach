/** 인앱 브라우저 감지 및 외부 브라우저 열기 유틸리티 */

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(|SamsungBrowser\/.*CrossApp/i.test(ua);
}

export function getInAppBrowserName(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/KAKAOTALK/i.test(ua)) return "카카오톡";
  if (/Instagram/i.test(ua)) return "인스타그램";
  if (/FBAN|FBAV/i.test(ua)) return "페이스북";
  if (/Line\//i.test(ua)) return "라인";
  if (/NAVER\(/i.test(ua)) return "네이버";
  return null;
}

/** 현재 URL을 외부 브라우저에서 열기 */
export function openInExternalBrowser(url?: string) {
  const target = url || window.location.href;
  // 카카오톡 인앱
  if (/KAKAOTALK/i.test(navigator.userAgent)) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(target)}`;
    return;
  }
  // 일반적인 intent 방식 (Android)
  if (/android/i.test(navigator.userAgent)) {
    window.location.href = `intent://${target.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
    return;
  }
  // iOS Safari 열기
  window.open(target, "_blank");
}
