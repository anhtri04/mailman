import { useState, useCallback } from 'react';
import type { FocusArea } from '../../../core/types';

interface UseFocusReturn {
  focusedArea: FocusArea;
  setFocus: (area: FocusArea) => void;
  clearFocus: () => void;
  isFocused: (area: FocusArea) => boolean;
}

export function useFocus(): UseFocusReturn {
  const [focusedArea, setFocusedArea] = useState<FocusArea>(null);

  const setFocus = useCallback((area: FocusArea) => {
    setFocusedArea(area);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedArea(null);
  }, []);

  const isFocused = useCallback(
    (area: FocusArea): boolean => {
      return focusedArea === area;
    },
    [focusedArea],
  );

  return {
    focusedArea,
    setFocus,
    clearFocus,
    isFocused,
  };
}
