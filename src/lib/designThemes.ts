export type ThemeMode = 'light' | 'dark';

export interface BrandTheme {
  id: string;
  label: string;
  iconSrc?: string;
  primary: string;
}

interface ParsedThemeColors {
  primary: string;
  lightSurface: string;
  lightBg: string;
  lightText: string;
  lightMuted: string;
  darkSurface: string;
  darkBg: string;
  darkText: string;
  darkMuted: string;
  border: string;
}

const DEFAULT_PRIMARY = '#2563eb';

const designThemeMarkdownFiles = import.meta.glob('/design-md-archive/*/DESIGN.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const designThemeIconFiles = import.meta.glob('/design-md-archive/*/icon.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function companyFromPath(path: string) {
  const matched = path.match(/\/design-md-archive\/([^/]+)\//);
  return matched?.[1] ?? null;
}

function toTitleCase(company: string) {
  return company
    .split(/[.-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function hexToRgb(hexColor: string) {
  const normalized = hexColor.replace('#', '').trim();
  if (normalized.length !== 3 && normalized.length !== 6) return null;

  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : normalized;

  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return null;

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance(hexColor: string) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

function withAlpha(hexColor: string, alpha: number) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return `rgba(37, 99, 235, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function isGray(hexColor: string) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  return max - min < 18;
}

function pickThemeColors(markdown: string): ParsedThemeColors {
  const hexes = Array.from(new Set(markdown.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []))
    .map((value) => (value.length === 9 ? value.slice(0, 7) : value))
    .filter((value) => value.length === 4 || value.length === 7);

  const sortedByLightness = [...hexes].sort((a, b) => luminance(b) - luminance(a));
  const lightBg = sortedByLightness.find((color) => luminance(color) > 240) ?? '#f8fafc';
  const lightSurface = sortedByLightness.find((color) => {
    const light = luminance(color);
    return light > 220 && light < 248;
  }) ?? '#ffffff';

  const sortedDark = [...hexes].sort((a, b) => luminance(a) - luminance(b));
  const darkBg = sortedDark.find((color) => luminance(color) < 28) ?? '#020617';
  const darkSurface = sortedDark.find((color) => {
    const light = luminance(color);
    return light >= 28 && light < 58;
  }) ?? '#0f172a';

  const saturated = hexes.find((color) => {
    const light = luminance(color);
    return !isGray(color) && light > 35 && light < 220;
  });

  const primary = saturated ?? DEFAULT_PRIMARY;

  const lightText = sortedDark.find((color) => luminance(color) < 70) ?? '#0f172a';
  const lightMuted = sortedDark.find((color) => {
    const light = luminance(color);
    return light >= 70 && light < 130;
  }) ?? '#475569';

  const darkText = sortedByLightness.find((color) => luminance(color) > 200) ?? '#e2e8f0';
  const darkMuted = sortedByLightness.find((color) => {
    const light = luminance(color);
    return light >= 145 && light < 205;
  }) ?? '#94a3b8';

  const border = sortedByLightness.find((color) => {
    const light = luminance(color);
    return light >= 150 && light < 225;
  }) ?? '#cbd5e1';

  return {
    primary,
    lightSurface,
    lightBg,
    lightText,
    lightMuted,
    darkSurface,
    darkBg,
    darkText,
    darkMuted,
    border,
  };
}

const parsedByTheme = new Map<string, ParsedThemeColors>();

export const brandThemes: BrandTheme[] = Object.entries(designThemeMarkdownFiles)
  .map(([path, markdown]) => {
    const id = companyFromPath(path);
    if (!id) return null;

    parsedByTheme.set(id, pickThemeColors(markdown));

    return {
      id,
      label: toTitleCase(id),
      iconSrc:
        designThemeIconFiles[`/design-md-archive/${id}/icon.svg`] ??
        designThemeIconFiles[`/design-md-archive/${id}/icon.png`] ??
        designThemeIconFiles[`/design-md-archive/${id}/icon.jpg`] ??
        designThemeIconFiles[`/design-md-archive/${id}/icon.jpeg`] ??
        designThemeIconFiles[`/design-md-archive/${id}/icon.webp`],
      primary: parsedByTheme.get(id)?.primary ?? DEFAULT_PRIMARY,
    };
  })
  .filter((theme): theme is BrandTheme => Boolean(theme))
  .sort((a, b) => a.label.localeCompare(b.label));

export function isKnownBrandTheme(value: string) {
  return value === 'home' || brandThemes.some((theme) => theme.id === value);
}

export function applyBrandTheme(root: HTMLElement, brandTheme: string, mode: ThemeMode) {
  root.dataset.brandTheme = brandTheme;

  if (brandTheme === 'home') {
    root.style.removeProperty('--app-bg');
    root.style.removeProperty('--app-surface');
    root.style.removeProperty('--app-border');
    root.style.removeProperty('--app-text');
    root.style.removeProperty('--app-muted');
    root.style.removeProperty('--app-primary');
    root.style.removeProperty('--app-primary-soft');
    root.style.removeProperty('--app-primary-soft-strong');
    root.style.removeProperty('--app-waiting-bg');
    root.style.removeProperty('--app-ready-bg');
    root.style.removeProperty('--app-click-bg');
    root.style.removeProperty('--app-neutral-soft');
    return;
  }

  const colors = parsedByTheme.get(brandTheme);
  if (!colors) return;

  const isDark = mode === 'dark';
  root.style.setProperty('--app-bg', isDark ? colors.darkBg : colors.lightBg);
  root.style.setProperty('--app-surface', isDark ? colors.darkSurface : colors.lightSurface);
  root.style.setProperty('--app-border', colors.border);
  root.style.setProperty('--app-text', isDark ? colors.darkText : colors.lightText);
  root.style.setProperty('--app-muted', isDark ? colors.darkMuted : colors.lightMuted);
  root.style.setProperty('--app-primary', colors.primary);
  root.style.setProperty('--app-primary-soft', withAlpha(colors.primary, isDark ? 0.24 : 0.16));
  root.style.setProperty('--app-primary-soft-strong', withAlpha(colors.primary, isDark ? 0.38 : 0.22));
  root.style.setProperty('--app-waiting-bg', withAlpha(colors.primary, isDark ? 0.32 : 0.18));
  root.style.setProperty('--app-ready-bg', isDark ? 'rgba(251, 113, 133, 0.28)' : 'rgba(251, 113, 133, 0.18)');
  root.style.setProperty('--app-click-bg', isDark ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.18)');
  root.style.setProperty('--app-neutral-soft', isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.16)');
}
