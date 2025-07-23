import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Messages, getMessages } from '@shared/messages';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  messages: Messages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get initial language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('eztax-language');
    return (saved === 'en' || saved === 'ko') ? saved : 'en';
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('eztax-language', newLanguage);
  };

  const messages = getMessages(language);

  const value: LanguageContextType = {
    language,
    setLanguage,
    messages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};