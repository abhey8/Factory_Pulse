import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Database, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  onRefresh?: () => void;
}

export function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Card className="max-w-md p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-slate-100 rounded-full">
            <Database className="w-12 h-12 text-slate-400" />
          </div>
        </div>
        <h2 className="font-semibold text-slate-900 mb-2">No Data Available</h2>
        <p className="text-sm text-slate-600 mb-6">
          No factory metrics are currently available. Try refreshing or seeding sample data to get started.
        </p>
        {onRefresh && (
          <Button onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        )}
      </Card>
    </div>
  );
}
