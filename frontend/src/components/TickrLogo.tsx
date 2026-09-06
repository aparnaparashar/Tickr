import React from 'react';

interface TickrLogoProps {
  className?: string;
  size?: number;
}

export const TickrLogo: React.FC<TickrLogoProps> = ({ className = 'w-7 h-7', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/tickr-brand-logo.png"
      alt="Tickr"
      className={`object-contain inline-block select-none ${className}`}
      style={style}
      loading="eager"
    />
  );
};
