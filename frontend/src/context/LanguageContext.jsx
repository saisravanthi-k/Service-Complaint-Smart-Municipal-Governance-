import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../translations/en.json';
import te from '../translations/te.json';
import hi from '../translations/hi.json';

const translations = { en, te, hi };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('citizen_language');
    return ['en', 'te', 'hi'].includes(saved) ? saved : 'en';
  });

  const setLanguage = (lang) => {
    if (['en', 'te', 'hi'].includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('citizen_language', lang);
    }
  };

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let currentObj = translations[language] || translations.en;
    let fallbackObj = translations.en;

    let result = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), currentObj);
    
    if (result === undefined) {
      result = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), fallbackObj);
    }

    if (result === undefined) {
      return key;
    }

    if (typeof result === 'string' && params && typeof params === 'object') {
      Object.keys(params).forEach((p) => {
        result = result.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
