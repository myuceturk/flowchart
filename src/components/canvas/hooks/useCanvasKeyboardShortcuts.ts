import { useEffect, useState } from 'react';

type CanvasKeyboardActions = {
  deleteSelection: () => void;
  duplicateSelection: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  selectAllNodes: () => void;
  nudgeSelectedNodes: (dx: number, dy: number) => void;
  undo: () => void;
  redo: () => void;
  setSearchOpen: (isOpen: boolean) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeIds: (ids: string[]) => void;
  getNodes: () => Array<{ id: string }>;
  getSelectedNodeIds: () => string[];
};

const MOVE_STEP = 5;
const MOVE_STEP_LARGE = 20;

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;

  if (!element) {
    return false;
  }

  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable
  );
}

export function useCanvasKeyboardShortcuts(actions: CanvasKeyboardActions) {
  const [isSpacePanning, setIsSpacePanning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const commandKey = isMac ? event.metaKey : event.ctrlKey;
      const key = event.key.toLowerCase();

      if (event.code === 'Space') {
        event.preventDefault();
        setIsSpacePanning(true);
        return;
      }

      if (commandKey && key === 'f') {
        event.preventDefault();
        actions.setSearchOpen(true);
        return;
      }

      if (commandKey && event.shiftKey && key === 'z') {
        event.preventDefault();
        actions.redo();
        return;
      }

      if (commandKey && key === 'z') {
        event.preventDefault();
        actions.undo();
        return;
      }

      if (commandKey && key === 'y') {
        event.preventDefault();
        actions.redo();
        return;
      }

      if (commandKey && key === 'd') {
        event.preventDefault();
        actions.duplicateSelection();
        return;
      }

      if (commandKey && key === 'c') {
        event.preventDefault();
        actions.copySelection();
        return;
      }

      if (commandKey && key === 'v') {
        event.preventDefault();
        actions.pasteClipboard();
        return;
      }

      if (commandKey && key === 'a') {
        event.preventDefault();
        actions.selectAllNodes();
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
        actions.deleteSelection();
        return;
      }

      if (key === 'escape') {
        event.preventDefault();
        actions.setSelectedNodeIds([]);
        actions.setSelectedEdgeIds([]);
        return;
      }

      if (key === 'tab') {
        event.preventDefault();
        const allNodes = actions.getNodes();
        if (allNodes.length === 0) return;
        const selectedIds = actions.getSelectedNodeIds();
        const currentIndex = selectedIds.length === 1
          ? allNodes.findIndex((n) => n.id === selectedIds[0])
          : -1;
        let nextIndex: number;
        if (event.shiftKey) {
          nextIndex = currentIndex <= 0 ? allNodes.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= allNodes.length - 1 ? 0 : currentIndex + 1;
        }
        actions.setSelectedNodeIds([allNodes[nextIndex].id]);
        return;
      }

      if (!event.key.startsWith('Arrow')) {
        return;
      }

      event.preventDefault();
      const step = event.shiftKey ? MOVE_STEP_LARGE : MOVE_STEP;

      if (event.key === 'ArrowLeft') {
        actions.nudgeSelectedNodes(-step, 0);
      } else if (event.key === 'ArrowRight') {
        actions.nudgeSelectedNodes(step, 0);
      } else if (event.key === 'ArrowUp') {
        actions.nudgeSelectedNodes(0, -step);
      } else if (event.key === 'ArrowDown') {
        actions.nudgeSelectedNodes(0, step);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [actions]);

  return { isSpacePanning };
}
