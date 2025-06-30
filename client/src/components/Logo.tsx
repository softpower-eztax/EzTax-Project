import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ theme = 'light' }) => {
  return (
    <Link href="/">
      <div className="flex items-center cursor-pointer">
        <div className={`mr-2 ${theme === 'light' ? 'bg-primary text-white' : 'bg-white text-primary'} font-heading font-bold text-xl px-3 py-1 rounded`}>
          EzTax
        </div>
        <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
          Less Tax, More Wealth
        </span>
      </div>
    </Link>
  );
};

export default Logo;
