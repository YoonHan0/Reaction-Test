import { useEffect, useState } from 'react';
import { applyBrandTheme, brandThemes, isKnownBrandTheme, type ThemeMode } from '../lib/designThemes';

type Theme = ThemeMode;

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [brandTheme, setBrandTheme] = useState<string>(() => {
    const stored = localStorage.getItem('brandTheme');
    return stored && isKnownBrandTheme(stored) ? stored : 'home';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    applyBrandTheme(root, brandTheme, theme);

    localStorage.setItem('theme', theme);
    localStorage.setItem('brandTheme', brandTheme);
  }, [brandTheme, theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return {
    theme,
    toggleTheme,
    brandTheme,
    setBrandTheme,
    brandThemes,
  };
}
