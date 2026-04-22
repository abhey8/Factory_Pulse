import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Card className="max-w-md p-12 text-center border-red-200">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-50 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        <h2 className="font-semibold text-slate-900 mb-2">Connection Error</h2>
        <p className="text-sm text-slate-600 mb-6">
          {message || "Unable to connect to the analytics backend. Please check your connection and try again."}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="destructive">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        )}
      </Card>
    </div>
  );
}
