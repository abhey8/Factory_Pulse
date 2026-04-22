import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="w-40 h-5 mb-2" />
              <Skeleton className="w-56 h-3" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="mb-8">
          <Skeleton className="w-48 h-6 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="w-32 h-4 mb-4" />
                <Skeleton className="w-24 h-8 mb-2" />
                <Skeleton className="w-40 h-3" />
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 p-6">
            <Skeleton className="w-48 h-5 mb-4" />
            <Skeleton className="w-full h-[300px]" />
          </Card>
          <Card className="p-6">
            <Skeleton className="w-48 h-5 mb-4" />
            <Skeleton className="w-full h-[300px]" />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Skeleton className="w-48 h-5 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="w-full h-16" />
                ))}
              </div>
            </Card>
          </div>
          <Card className="p-6">
            <Skeleton className="w-48 h-5 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="w-full h-20" />
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
