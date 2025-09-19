import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  color?: 'blue' | 'green' | 'purple' | 'red' | 'amber' | 'gray';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-100'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'text-gray-600',
      iconBg: 'bg-gray-100'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className={`${colors.iconBg} p-3 rounded-xl`}>
            <Icon className={`h-8 w-8 ${colors.icon}`} />
          </div>
        )}
        <div className="text-right flex-1 ml-4">
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{title}</div>
        </div>
      </div>
      
      {subtitle && (
        <div className="text-sm text-gray-600 mb-3">{subtitle}</div>
      )}
      
      {trend && (
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
            <span>{trend.value}%</span>
          </div>
          <span className="text-sm text-gray-500">{trend.label}</span>
        </div>
      )}
      
      <div className={`mt-3 ${colors.bg} rounded-full h-2`}>
        <div 
          className={`${colors.icon.replace('text-', 'bg-')} h-2 rounded-full transition-all duration-500`}
          style={{ width: '75%' }}
        />
      </div>
    </div>
  );
};

export default MetricCard;