import { Badge } from "./ui/badge";

interface StatusBadgeProps {
  status: 'working' | 'idle' | 'absent' | 'active' | 'offline';
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusConfig = {
    working: { label: 'Working', className: 'bg-green-100 text-green-700 border-green-200' },
    active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
    idle: { label: 'Idle', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    absent: { label: 'Absent', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    offline: { label: 'Offline', className: 'bg-red-100 text-red-700 border-red-200' }
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className} font-medium`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'working' || status === 'active' ? 'bg-green-500' :
        status === 'idle' ? 'bg-amber-500' :
        status === 'offline' ? 'bg-red-500' : 'bg-slate-400'
      }`} />
      {config.label}
    </Badge>
  );
}
