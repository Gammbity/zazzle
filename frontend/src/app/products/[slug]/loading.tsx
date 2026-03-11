export default function ProductDetailLoading() {
  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb skeleton */}
      <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </nav>

      {/* Main content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image gallery skeleton */}
          <div className="space-y-4">
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-gray-200" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 w-16 animate-pulse rounded-lg bg-gray-200"
                />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-6">
            <div>
              <div className="mb-2 h-8 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-6 w-1/4 animate-pulse rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200" />
            </div>
            <hr className="border-gray-100" />
            {/* Editor skeleton */}
            <div>
              <div className="mb-3 h-6 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="mb-4 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="aspect-square w-full animate-pulse rounded-xl bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
