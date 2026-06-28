export default function Unauthorized() {
    return (
      <div className="flex items-center justify-center min-h-screen bg-layer-1">
        <div className="p-8 bg-white rounded shadow-md">
          <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
          <p className="text-ink-dim">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }