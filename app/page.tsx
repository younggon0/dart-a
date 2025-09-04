export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">DART-E Intelligence Platform</h1>
        </div>
      </header>
      
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-gray-50 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Company</h3>
              <p className="text-sm text-gray-600">Samsung Electronics</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Search Settings</h3>
              <div className="space-y-2">
                <label className="block text-sm">
                  <span className="text-gray-600">Max Results</span>
                  <input 
                    type="number" 
                    className="mt-1 w-full rounded border px-2 py-1"
                    defaultValue={5}
                  />
                </label>
              </div>
            </div>
          </div>
        </aside>
        
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Welcome to DART-E</h2>
            <p className="text-gray-600 mb-6">
              Ask questions about financial data and get instant insights.
            </p>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-center text-gray-500">
                Chat interface coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}