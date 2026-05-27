import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCliResponseSectionDefaultCollapsed,
  getCliResponseSectionIds,
  getCliSectionKey,
} from '../utils/responseSections';
import type {
  CliOutputEntry,
  CliPanelFocus,
  CliResponseOutputEntry,
  CliResponseSectionId,
  CliViewToggles,
} from '../types';

interface UseCliKeyboardNavigationInput {
  outputs: CliOutputEntry[];
  toggles: CliViewToggles;
}

export function useCliKeyboardNavigation({ outputs, toggles }: UseCliKeyboardNavigationInput) {
  const [focusedPanel, setFocusedPanel] = useState<CliPanelFocus>('input');
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<CliResponseSectionId | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const responseEntries = useMemo(
    () => outputs.filter((entry): entry is CliResponseOutputEntry => entry.kind === 'response'),
    [outputs],
  );

  const getResponseSections = useCallback(
    (responseId: string | null): CliResponseSectionId[] => {
      if (!responseId) return [];
      const entry = responseEntries.find((item) => item.id === responseId);
      if (!entry) return [];
      return getCliResponseSectionIds(entry.response, entry.request.protocol, toggles);
    },
    [responseEntries, toggles],
  );

  const focusInput = useCallback(() => {
    setFocusedPanel('input');
  }, []);

  const focusOutput = useCallback(() => {
    setFocusedPanel('output');
    setSelectedResponseId((current) => {
      if (current && responseEntries.some((entry) => entry.id === current)) return current;
      return responseEntries.at(-1)?.id ?? null;
    });
  }, [responseEntries]);

  const focusResponse = useCallback(
    (responseId: string) => {
      const sections = getResponseSections(responseId);
      setFocusedPanel('output');
      setSelectedResponseId(responseId);
      setSelectedSectionId((current) =>
        current && sections.includes(current) ? current : (sections[0] ?? null),
      );
    },
    [getResponseSections],
  );

  const focusSection = useCallback((sectionId: CliResponseSectionId) => {
    setFocusedPanel('output');
    setSelectedSectionId(sectionId);
  }, []);

  const moveResponseSelection = useCallback(
    (delta: number) => {
      if (responseEntries.length === 0) return;
      setFocusedPanel('output');
      setSelectedResponseId((current) => {
        const currentIndex = responseEntries.findIndex((entry) => entry.id === current);
        const safeIndex = currentIndex === -1 ? responseEntries.length - 1 : currentIndex;
        const nextIndex = (safeIndex + delta + responseEntries.length) % responseEntries.length;
        const nextId = responseEntries[nextIndex]?.id ?? null;
        const nextSections = getResponseSections(nextId);
        setSelectedSectionId((section) =>
          section && nextSections.includes(section) ? section : (nextSections[0] ?? null),
        );
        return nextId;
      });
    },
    [getResponseSections, responseEntries],
  );

  const moveSectionSelection = useCallback(
    (delta: number) => {
      const sections = getResponseSections(selectedResponseId);
      if (sections.length === 0) return;
      setFocusedPanel('output');
      setSelectedSectionId((current) => {
        const currentIndex = current ? sections.indexOf(current) : -1;
        const safeIndex = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = (safeIndex + delta + sections.length) % sections.length;
        return sections[nextIndex] ?? null;
      });
    },
    [getResponseSections, selectedResponseId],
  );

  const getSectionDefaultCollapsed = useCallback(
    (responseId: string | null, sectionId: CliResponseSectionId | null): boolean => {
      if (!responseId || !sectionId) return false;
      const entry = responseEntries.find((item) => item.id === responseId);
      if (!entry) return false;
      return getCliResponseSectionDefaultCollapsed(
        entry.response,
        entry.request.protocol,
        sectionId,
      );
    },
    [responseEntries],
  );

  const setSectionCollapsed = useCallback(
    (responseId: string | null, sectionId: CliResponseSectionId | null, collapsed: boolean) => {
      if (!responseId || !sectionId) return;
      const key = getCliSectionKey(responseId, sectionId);
      setCollapsedSections((prev) => ({ ...prev, [key]: collapsed }));
    },
    [],
  );

  const toggleSection = useCallback(
    (
      responseId: string | null,
      sectionId: CliResponseSectionId | null,
      defaultCollapsed?: boolean,
    ) => {
      if (!responseId || !sectionId) return;
      const key = getCliSectionKey(responseId, sectionId);
      const fallback = defaultCollapsed ?? getSectionDefaultCollapsed(responseId, sectionId);
      setCollapsedSections((prev) => ({ ...prev, [key]: !(prev[key] ?? fallback) }));
    },
    [getSectionDefaultCollapsed],
  );

  const isSectionCollapsed = useCallback(
    (responseId: string, sectionId: CliResponseSectionId, defaultCollapsed = false): boolean => {
      return collapsedSections[getCliSectionKey(responseId, sectionId)] ?? defaultCollapsed;
    },
    [collapsedSections],
  );

  const resetOutputNavigation = useCallback(() => {
    setSelectedResponseId(null);
    setSelectedSectionId(null);
    setCollapsedSections({});
  }, []);

  useEffect(() => {
    if (responseEntries.length === 0) {
      setSelectedResponseId(null);
      setSelectedSectionId(null);
      return;
    }

    if (focusedPanel !== 'output') return;

    const responseId =
      selectedResponseId && responseEntries.some((entry) => entry.id === selectedResponseId)
        ? selectedResponseId
        : (responseEntries.at(-1)?.id ?? null);

    if (responseId !== selectedResponseId) {
      setSelectedResponseId(responseId);
    }

    const sections = getResponseSections(responseId);
    if (selectedSectionId === null || !sections.includes(selectedSectionId)) {
      setSelectedSectionId(sections[0] ?? null);
    }
  }, [focusedPanel, getResponseSections, responseEntries, selectedResponseId, selectedSectionId]);

  return {
    focusedPanel,
    selectedResponseId,
    selectedSectionId,
    collapsedSections,
    focusInput,
    focusOutput,
    focusResponse,
    focusSection,
    moveResponseSelection,
    moveSectionSelection,
    setSectionCollapsed,
    toggleSection,
    isSectionCollapsed,
    resetOutputNavigation,
  };
}
