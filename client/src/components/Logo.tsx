import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ theme = 'light' }) => {
  return (
    <Link href="/">
      <a className="flex items-center">
        <div className={`mr-2 ${theme === 'light' ? 'bg-primary text-white' : 'bg-white text-primary'} font-heading font-bold text-xl px-3 py-1 rounded`}>
          EzTax
        </div>
        <span className={theme === 'light' ? 'text-primary-dark text-sm font-heading' : 'text-white text-sm font-heading'}>
          Simple Tax Preparation
        </span>
      </a>
    </Link>
  );
};

export default Logo;
