import React from 'react';
import { ButtonVariant } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false, 
  children, 
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-sky-500 hover:bg-sky-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.25)] rounded-2xl py-3 px-6",
    secondary: "bg-white text-sky-600 border-2 border-sky-100 hover:border-sky-200 shadow-sm rounded-2xl py-3 px-6",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl py-2 px-4",
    icon: "bg-white p-3 rounded-full text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50"
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};