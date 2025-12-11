import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ icon, className, ...props }) => (
  <div className="relative">
    {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
    <input className={clsx('input-field w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-500', icon && 'pl-10', className)} {...props} />
  </div>
);
