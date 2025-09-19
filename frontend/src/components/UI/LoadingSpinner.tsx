import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
    xl: 'h-12 w-12 border-4'
  };

  const colorClasses = {
    primary: 'border-gray-200 border-t-blue-600',
    secondary: 'border-gray-200 border-t-purple-600',
    white: 'border-gray-300 border-t-white',
    gray: 'border-gray-300 border-t-gray-600'
  };

  return (
    <div 
      className={`
        animate-spin rounded-full 
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        ${className}
      `}
    />
  );
};

export default LoadingSpinner;