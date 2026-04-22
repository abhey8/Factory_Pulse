import { Card } from "./ui/card";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: LucideIcon;
  className?: string;
}

export function KPICard({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon: Icon,
  className = ""
}: KPICardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400';

  return (
    <Card className={`p-6 bg-white border border-slate-200 hover:border-slate-300 transition-colors ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {Icon && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        {unit && <span className="text-lg text-slate-500">{unit}</span>}
      </div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="font-medium">{trendValue}</span>
          <span className="text-slate-500 ml-1">vs last period</span>
        </div>
      )}
    </Card>
  );
}
