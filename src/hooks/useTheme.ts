import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    // Get all classes that start with 'theme-' or are 'light'/'dark'
    const themeClasses = Array.from(root.classList).filter(c => c.startsWith('theme-') || c === 'light' || c === 'dark');
    root.classList.remove(...themeClasses);
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
