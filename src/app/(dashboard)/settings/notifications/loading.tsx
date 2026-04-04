export default function NotificationSettingsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-8 w-48 rounded-xl animate-shimmer" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl animate-shimmer" />
        ))}
      </div>
      <div className="h-48 rounded-2xl animate-shimmer" />
    </div>
  );
}
