import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * next-intl 의 locale-aware 네비게이션 헬퍼.
 *
 * next/link, next/navigation 의 useRouter / usePathname / redirect 와 동일한
 * API 를 제공하지만 routing.ts 의 locales / defaultLocale / localePrefix 를 알고
 * 있어서 자동으로 prefix 를 붙이거나 떼준다.
 *
 * 사용 예:
 *   import { Link, useRouter, usePathname } from "@/i18n/navigation";
 *   <Link href="/sites">현장</Link>           // ko → /sites, en → /en/sites
 *   const path = usePathname();              // ko 든 en 이든 "/sites" 로 반환
 *   router.push("/customers", { locale: "en" }); // /en/customers 로 이동
 *
 * 이 파일이 단일 출처이므로, 페이지·컴포넌트에서 절대 next/link 의 default
 * import 를 직접 쓰지 말고 여기서 가져오기.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
