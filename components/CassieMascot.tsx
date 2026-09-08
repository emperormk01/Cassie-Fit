import React from 'react';

interface CassieMascotProps {
  expression?: 'happy' | 'neutral' | 'curious' | 'sleeping';
  className?: string;
  size?: number;
}

export const CassieMascot: React.FC<CassieMascotProps> = ({ 
  expression = 'happy', 
  className = '',
  size = 64
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Head Shape - Organic hand-drawn feel */}
      <path 
        d="M20 35C15 20 25 10 35 15C45 12 55 12 65 15C75 10 85 20 80 35C88 45 88 65 80 80C70 92 30 92 20 80C12 65 12 45 20 35Z" 
        fill="white" 
        stroke="#18181B" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Ears Inner */}
      <path d="M25 32L32 25" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M75 32L68 25" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* Eyes */}
      {expression === 'sleeping' ? (
        <>
           {/* Closed eyes curves */}
           <path d="M32 50 Q38 55 44 50" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
           <path d="M56 50 Q62 55 68 50" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="40" cy="48" r="3" fill="#18181B" />
          <circle cx="60" cy="48" r="3" fill="#18181B" />
        </>
      )}

      {/* Nose */}
      <path d="M48 56C48 56 50 58 52 56" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" />

      {/* Mouth */}
      {expression === 'happy' && (
        <path d="M45 62Q50 66 55 62" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
      )}
      {expression === 'curious' && (
         <circle cx="50" cy="62" r="2" fill="#18181B" />
      )}
      {/* Small mouth for sleeping */}
      {expression === 'sleeping' && (
         <path d="M48 60 Q50 62 52 60" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />
      )}

      {/* Whiskers */}
      <path d="M25 55L15 52" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M25 60L15 62" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />
      
      <path d="M75 55L85 52" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M75 60L85 62" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Zzz for sleeping */}
      {expression === 'sleeping' && (
        <path d="M85 30 L95 30 L85 40 L95 40" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70" />
      )}
    </svg>
  );
};