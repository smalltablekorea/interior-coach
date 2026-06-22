import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import DemoRequestForm from "./DemoRequestForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("demoRequest.meta");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
    alternates: { canonical: "/demo-request" },
  };
}

export default async function DemoRequestPage() {
  const t = await getTranslations("demoRequest");
  const tCommon = await getTranslations("common");
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft size={16} /> {tCommon("backToHome")}
          </Link>
          <span className="text-sm font-bold text-[var(--green)]">
            {tCommon("appName")}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-sm font-semibold text-[var(--green)] mb-3">
            {t("badge")}
          </p>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">
            {t("headingLine1")}
            <br />
            {t("headingLine2")}
          </h1>
          <p className="mt-5 text-[var(--muted)] leading-relaxed">
            {t("subheadingLine1")}
            <br />
            {t("subheadingLine2")}
          </p>
        </div>

        <DemoRequestForm />
      </main>
    </div>
  );
}
