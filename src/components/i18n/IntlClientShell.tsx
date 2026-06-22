"use client";

import type { ReactNode } from "react";
import { IntlProvider } from "use-intl/react";

/**
 * 서버 RootLayout 이 IntlProvider 를 직접 임포트하면 RSC 빌드 단계에서
 *   TypeError: createContext is not a function
 * 이 발생한다 (IntlProvider 는 클라이언트 전용 컨텍스트). 이 셸이 "use client"
 * 경계를 만들어, RootLayout 은 RSC 그대로 두고 클라이언트 트리에만
 * Provider 가 마운트되도록 한다.
 */
interface Props {
  locale: string;
  messages: Record<string, unknown>;
  now: Date;
  timeZone: string;
  children: ReactNode;
}

export default function IntlClientShell({
  locale,
  messages,
  now,
  timeZone,
  children,
}: Props) {
  return (
    <IntlProvider
      locale={locale}
      messages={messages}
      now={now}
      timeZone={timeZone}
    >
      {children}
    </IntlProvider>
  );
}
