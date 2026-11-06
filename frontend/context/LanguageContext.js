import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../lib/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('habesha_lang');
      if (stored === 'en' || stored === 'am') {
        setLanguageState(stored);
      }
    }
  }, []);

  const setLanguage = (lang) => {
    const target = lang === 'am' ? 'am' : 'en';
    setLanguageState(target);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('habesha_lang', target);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  const t = (key, fallbackOrVars = '', maybeVars = {}) => {
    let fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : '';
    let vars = typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars;

    const dict = translations[language] || translations.en;
    let template = dict?.[key] ?? translations.en?.[key] ?? fallback ?? key;

    if (vars && typeof template === 'string') {
      Object.keys(vars).forEach((varKey) => {
        template = template.replace(new RegExp(`\\{${varKey}\\}`, 'g'), vars[varKey]);
      });
    }
    return template;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key, fallback = '') => fallback || key,
    };
  }
  return context;
};

export default LanguageContext;
