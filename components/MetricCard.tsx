import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
}

export function MetricCard({ title, value, subtitle, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {Icon && (
            <div className="rounded-full bg-gray-100 dark:bg-[#1a1a1a] p-3">
              <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

