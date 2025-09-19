import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'pending';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  text, 
  size = 'md',
  showIcon = true,
  className = '' 
}) => {
  const statusConfig = {
    online: {
      icon: CheckCircleIcon,
      text: text || 'Online',
      classes: 'bg-green-50 text-green-700 border-green-200',
      iconColor: 'text-green-500'
    },
    offline: {
      icon: XCircleIcon,
      text: text || 'Offline',
      classes: 'bg-red-50 text-red-700 border-red-200',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      text: text || 'Warning',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-500'
    },
    pending: {
      icon: ClockIcon,
      text: text || 'Pending',
      classes: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-500'
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span 
      className={`
        inline-flex items-center font-semibold rounded-full border
        ${config.classes}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {showIcon && (
        <Icon className={`${iconSizes[size]} ${config.iconColor} mr-1.5`} />
      )}
      {config.text}
    </span>
  );
};

export default StatusBadge;