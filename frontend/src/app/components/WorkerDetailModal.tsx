import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Worker } from "../types";
import { StatusBadge } from "./StatusBadge";
import { User, Clock, Target, TrendingUp, MapPin } from "lucide-react";
import { Progress } from "./ui/progress";

interface WorkerDetailModalProps {
  worker: Worker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkerDetailModal({ worker, open, onOpenChange }: WorkerDetailModalProps) {
  if (!worker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xl">{worker.name}</p>
              <p className="text-sm font-normal text-slate-500">{worker.id}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Current Status</span>
            <StatusBadge status={worker.status} />
          </div>

          {worker.station && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Assigned to</span>
              <span className="text-sm font-semibold text-slate-900">{worker.station}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Active Time</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{worker.activeTime}h</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Idle Time</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{worker.idleTime}h</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Units Produced</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{worker.unitsProduced}</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Units/Hour</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{worker.unitsPerHour}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Utilization Rate</span>
              <span className="text-sm font-semibold text-slate-900">{worker.utilization}%</span>
            </div>
            <Progress value={worker.utilization} className="h-2" />
              <p className="text-xs text-slate-500">
              Based on {worker.trackedTime} hours of tracked time
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Performance Summary</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <p>• {worker.utilization >= 85 ? 'Exceeding' : worker.utilization >= 70 ? 'Meeting' : 'Below'} productivity targets</p>
              <p>• Average production rate: {worker.unitsPerHour} units/hour</p>
              <p>• Total tracked time: {worker.trackedTime.toFixed(1)} hours</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
