import { Building2, Home, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ModeBar = () => {
  const { theme, toggleTheme, brandTheme, setBrandTheme, brandThemes } = useTheme();

  return (
    <div className="mb-5 border-b border-[var(--app-border)] pb-3">
      <div className="mb-3 flex items-center justify-end">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-text)] transition-opacity hover:opacity-85"
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {theme === 'dark' ? '라이트' : '다크'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setBrandTheme('home')}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            borderColor: brandTheme === 'home' ? 'var(--app-primary)' : 'var(--app-border)',
            backgroundColor: brandTheme === 'home' ? 'var(--app-primary)' : 'var(--app-surface)',
            color: brandTheme === 'home' ? '#ffffff' : 'var(--app-text)',
          }}
        >
          <Home className="h-3.5 w-3.5" />
          홈
        </button>

        {brandThemes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setBrandTheme(item.id)}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              borderColor: brandTheme === item.id ? item.primary : 'var(--app-border)',
              backgroundColor: brandTheme === item.id ? item.primary : 'var(--app-surface)',
              color: brandTheme === item.id ? '#ffffff' : 'var(--app-text)',
            }}
          >
            {item.iconSrc ? (
              <img src={item.iconSrc} alt={`${item.label} 아이콘`} className="h-3.5 w-3.5 rounded-sm" />
            ) : (
              <Building2 className="h-3.5 w-3.5" />
            )}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
