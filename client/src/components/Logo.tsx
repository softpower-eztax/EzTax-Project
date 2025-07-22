import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../context/LanguageContext';

interface LogoProps {
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ theme = 'light' }) => {
  const { messages } = useLanguage();
  
  return (
    <Link href="/">
      <div className="flex items-center cursor-pointer">
        <div className={`mr-2 ${theme === 'light' ? 'bg-primary text-white' : 'bg-white text-primary'} font-heading font-bold text-xl px-3 py-1 rounded`}>
          EzTax
        </div>
        <span className={theme === 'light' ? 'text-primary-dark text-sm font-heading' : 'text-white text-sm font-heading'}>{messages.common.logoTagline}</span>
      </div>
    </Link>
  );
};

export default Logo;
