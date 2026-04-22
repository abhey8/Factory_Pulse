import { Card } from "./ui/card";
import { Event } from "../types";
import { Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

interface EventFeedProps {
  events: Event[];
}

export function EventFeed({ events }: EventFeedProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getEventTypeLabel = (type: Event['eventType']) => {
    const labels = {
      product_count: 'Production',
      working: 'Working',
      idle: 'Idle',
      absent: 'Absent'
    };
    return labels[type];
  };

  const getEventTypeColor = (type: Event['eventType']) => {
    const colors = {
      product_count: 'bg-green-100 text-green-700 border-green-200',
      working: 'bg-blue-100 text-blue-700 border-blue-200',
      idle: 'bg-amber-100 text-amber-700 border-amber-200',
      absent: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[type];
  };

  return (
    <Card className="p-6 bg-white border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Recent Events</h3>
        <Badge variant="outline" className="text-xs">
          Backend Events
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {events.length === 0 && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
              No events match the current filters.
            </div>
          )}

          {events.map((event) => (
            <div
              key={event.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className={`text-xs ${getEventTypeColor(event.eventType)}`}>
                  {getEventTypeLabel(event.eventType)}
                </Badge>
                <span className="text-xs text-slate-500">
                  Confidence: {(event.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="text-sm text-slate-700">
                <span className="font-medium">{event.workerName}</span>
                <span className="text-slate-500"> • </span>
                <span className="text-slate-600">{event.stationName ?? event.stationId}</span>
                {event.count && (
                  <>
                    <span className="text-slate-500"> • </span>
                    <span className="text-slate-600">{event.count} units</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
