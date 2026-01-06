export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          🎬 Movie Agent
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          AI-Powered Movie Recommendations
        </p>
        <div className="flex gap-4 justify-center">
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="font-semibold mb-2">Step 1 Complete ✓</h2>
            <p className="text-sm text-muted-foreground">
              Project initialized with Next.js 14, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
