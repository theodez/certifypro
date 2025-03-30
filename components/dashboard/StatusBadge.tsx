import { FormationStatus } from '@/lib/utils/formation';
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: FormationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: FormationStatus) => {
    switch (status) {
      case 'Valide':
        return {
          label: 'À jour',
          className: 'bg-status-valid/10 text-status-valid'
        };
      case 'À renouveler':
        return {
          label: 'À renouveler',
          className: 'bg-status-warning/10 text-status-warning'
        };
      case 'Expirée':
        return {
          label: 'Expirée',
          className: 'bg-status-expired/10 text-status-expired'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
