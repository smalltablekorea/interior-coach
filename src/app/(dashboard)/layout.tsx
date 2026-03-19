"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Sidebar />
        <div className="md:ml-60 transition-all duration-200">
          <Header />
          <main className="p-6 pb-24 md:pb-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
