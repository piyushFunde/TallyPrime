"use client";

import { useEffect, useCallback } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

/**
 * Custom hook for handling keyboard shortcuts globally.
 * 
 * Key format: "ctrl+shift+k", "alt+l", "f8", "escape"
 * Modifiers: ctrl, shift, alt, meta
 * 
 * Usage:
 *   useKeyboardShortcuts({
 *     "alt+l": () => router.push("/ledgers"),
 *     "f8": () => router.push("/vouchers/sales"),
 *     "escape": () => router.back(),
 *   });
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Build the key string
      const parts: string[] = [];
      if (event.ctrlKey || event.metaKey) parts.push("ctrl");
      if (event.shiftKey) parts.push("shift");
      if (event.altKey) parts.push("alt");

      // Normalize the key name
      let key = event.key.toLowerCase();
      if (key === " ") key = "space";
      if (key === "escape") key = "escape";

      // For function keys, don't include modifiers in the key itself
      if (!["control", "shift", "alt", "meta"].includes(key)) {
        parts.push(key);
      }

      const combo = parts.join("+");

      // Check if this shortcut is registered
      if (shortcuts[combo]) {
        // Allow Escape even when typing
        if (isTyping && combo !== "escape") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        shortcuts[combo]();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
