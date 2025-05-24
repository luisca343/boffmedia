export function EventsLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-xl text-surface-300">Cargando eventos...</p>
      </div>
    </div>
  );
}