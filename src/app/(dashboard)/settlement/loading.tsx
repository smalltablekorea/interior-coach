export default function SettlementLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-8 w-40 rounded-xl animate-shimmer" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl animate-shimmer" />
        ))}
      </div>
      <div className="h-72 rounded-2xl animate-shimmer" />
    </div>
  );
}
