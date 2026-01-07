export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8 lg:p-24">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          🎬 Movie Agent
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg mb-8">
          AI-Powered Movie Recommendations
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="font-semibold mb-2">Step 1 ✓</h2>
            <p className="text-sm text-muted-foreground">
              Project initialized
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="font-semibold mb-2">Step 2 ✓</h2>
            <p className="text-sm text-muted-foreground">
              Types & constants
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card sm:col-span-2 lg:col-span-1">
            <h2 className="font-semibold mb-2">Step 3 ✓</h2>
            <p className="text-sm text-muted-foreground">
              Layout & dark mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
