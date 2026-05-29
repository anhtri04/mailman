import { useState, useEffect, useCallback } from 'react';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';

export interface DirItem {
  name: string;
  isDirectory: boolean;
}

interface UseDirectoryReturn {
  currentPath: string;
  items: DirItem[];
  loading: boolean;
  error: string | null;
  setCurrentPath: (path: string) => void;
  goUp: () => void;
}

function expandHome(path: string): string {
  if (path.startsWith('~')) {
    return join(homedir(), path.slice(1));
  }
  return path;
}

export function useDirectory(
  startPath: string,
  filterFn?: (item: DirItem) => boolean,
): UseDirectoryReturn {
  const [currentPath, setCurrentPathRaw] = useState(() => expandHome(startPath));
  const [items, setItems] = useState<DirItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCurrentPath = useCallback((path: string) => {
    setCurrentPathRaw(expandHome(path));
  }, []);

  const goUp = useCallback(() => {
    setCurrentPathRaw((prev) => {
      const parent = dirname(prev);
      return parent === prev ? prev : parent;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const dirents = await readdir(currentPath, { withFileTypes: true });
        if (cancelled) return;

        let list = dirents.map((d) => ({
          name: d.name,
          isDirectory: d.isDirectory(),
        }));

        if (filterFn) {
          list = list.filter((i) => i.isDirectory || filterFn(i));
        }

        list.sort((a, b) => {
          if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
          return a.isDirectory ? -1 : 1;
        });

        setItems(list);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentPath, filterFn]);

  return { currentPath, items, loading, error, setCurrentPath, goUp };
}
