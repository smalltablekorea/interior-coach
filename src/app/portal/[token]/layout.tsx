export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
            IC
          </div>
          <span className="font-semibold text-gray-700">인테리어코치</span>
          <span className="text-xs text-gray-400 ml-2">고객 포탈</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-gray-200 px-4 py-4 text-center text-xs text-gray-400">
        인테리어코치 고객 전용 포탈
      </footer>
    </div>
  );
}
