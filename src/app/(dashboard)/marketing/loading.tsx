export default function MarketingLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-8 w-40 rounded-xl animate-shimmer" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl animate-shimmer" />
        ))}
      </div>
    </div>
  );
}
