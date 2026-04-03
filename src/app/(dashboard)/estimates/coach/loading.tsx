export default function CoachLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-8 w-56 rounded-xl animate-shimmer" />
      <div className="h-12 rounded-2xl animate-shimmer" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-96 rounded-2xl animate-shimmer" />
        <div className="h-96 rounded-2xl animate-shimmer" />
      </div>
    </div>
  );
}
