import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { adaptTheme } from './theme-adapter';
import { loadPreferences, savePreferences } from '../services/preferences';
import { colors as defaultColors } from './colors';
import type { MailmanColors, OpencodeTheme } from './types';

const THEMES_DIR = join(import.meta.dir, './themes');

interface ThemeContextValue {
  colors: MailmanColors;
  themes: OpencodeTheme[];
  currentThemeId: string;
  setTheme: (id: string) => void;
  previewTheme: (id: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadThemes(): OpencodeTheme[] {
  try {
    const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith('.json'));
    const themes = files.map((file) => {
      const data = readFileSync(join(THEMES_DIR, file), 'utf-8');
      return JSON.parse(data) as OpencodeTheme;
    });
    themes.sort((a, b) => a.name.localeCompare(b.name));
    return themes;
  } catch (error) {
    console.error('Failed to load themes:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themes, setThemes] = useState<OpencodeTheme[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState('dracula');
  const [colors, setColors] = useState<MailmanColors>(defaultColors);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const loadedThemes = loadThemes();
        setThemes(loadedThemes);

        const prefs = await loadPreferences();
        const saved = loadedThemes.find((t) => t.id === prefs.themeId);
        if (saved) {
          setCurrentThemeId(saved.id);
          setColors(adaptTheme(saved));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to initialize theme:', message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setTheme = useCallback(
    async (id: string) => {
      const theme = themes.find((t) => t.id === id);
      if (!theme) return;
      setCurrentThemeId(theme.id);
      setColors(adaptTheme(theme));
      await savePreferences({ themeId: theme.id });
    },
    [themes],
  );

  const previewTheme = useCallback(
    (id: string) => {
      const theme = themes.find((t) => t.id === id);
      if (!theme) return;
      setColors(adaptTheme(theme));
    },
    [themes],
  );

  return (
    <ThemeContext.Provider
      value={{ colors, themes, currentThemeId, setTheme, previewTheme, isLoading }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
