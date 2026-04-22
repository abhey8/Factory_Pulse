import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Workstation } from "../types";
import { StatusBadge } from "./StatusBadge";
import { Factory, Clock, Target, TrendingUp, User } from "lucide-react";
import { Progress } from "./ui/progress";

interface WorkstationDetailModalProps {
  workstation: Workstation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkstationDetailModal({ workstation, open, onOpenChange }: WorkstationDetailModalProps) {
  if (!workstation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 rounded-lg">
              <Factory className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-xl">{workstation.name}</p>
              <p className="text-sm font-normal text-slate-500">{workstation.id}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Station Status</span>
            <StatusBadge status={workstation.status} />
          </div>

          {workstation.assignedWorker && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Current operator:</span>
              <span className="text-sm font-semibold text-slate-900">{workstation.assignedWorker}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Occupancy Time</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{workstation.occupancyTime}h</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Utilization</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{workstation.utilization}%</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Units Produced</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{workstation.unitsProduced}</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Throughput Rate</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{workstation.throughputRate}</p>
              <p className="text-xs text-slate-500 mt-1">units/hour</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Utilization Rate</span>
              <span className="text-sm font-semibold text-slate-900">{workstation.utilization}%</span>
            </div>
            <Progress value={workstation.utilization} className="h-2" />
            <p className="text-xs text-slate-500">
              Station operational efficiency over current shift
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Station Performance</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <p>• {workstation.utilization >= 85 ? 'High' : workstation.utilization >= 70 ? 'Normal' : 'Low'} efficiency operating level</p>
              <p>• Throughput: {workstation.throughputRate} units per hour</p>
              <p>• Total production: {workstation.unitsProduced} units today</p>
              {workstation.status === 'offline' && <p className="text-red-600">• Station currently offline - maintenance required</p>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
