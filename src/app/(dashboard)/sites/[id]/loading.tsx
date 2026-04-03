export default function SiteDetailLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded animate-shimmer" />
        <div className="h-8 w-64 rounded-xl animate-shimmer" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl animate-shimmer" />
        ))}
      </div>
      <div className="h-80 rounded-2xl animate-shimmer" />
    </div>
  );
}
