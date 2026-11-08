import { useEffect } from "react";

/**
 * A hook that traps focus within a specific DOM element.
 * Useful for modals, dialogs, and side sheets.
 * It also restores focus to the previously active element when unmounted.
 */
export function useFocusTrap(
  ref: React.RefObject<any>,
  isActive: boolean = true,
  initialFocusRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const container = ref.current as HTMLElement;
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    // Get all focusable elements inside the container
    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]):not([aria-disabled="true"]), textarea:not([disabled]):not([aria-disabled="true"]), input:not([type="hidden"]):not([disabled]):not([aria-disabled="true"]), select:not([disabled]):not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        // Ensure the element is actually visible and not within an aria-hidden container
        if (el.closest('[aria-hidden="true"]')) return false;
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const index = focusableElements.indexOf(document.activeElement as HTMLElement);
      const step = e.shiftKey ? -1 : 1;
      const next =
        index === -1
          ? e.shiftKey
            ? focusableElements.length - 1
            : 0
          : (index + step + focusableElements.length) % focusableElements.length;
      e.preventDefault();
      focusableElements[next].focus();
    };

    // Initial focus on the container or first element
    // setTimeout is needed because the dialog might be rendering and animating
    const focusTimeout = setTimeout(() => {
      if (initialFocusRef && initialFocusRef.current) {
        initialFocusRef.current.focus();
      } else {
        const focusableElements = getFocusableElements();
        // If the container itself has tabIndex={-1}, we can focus it directly
        if (container.hasAttribute("tabindex")) {
          container.focus();
        } else if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    }, 10);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus
      if (previouslyFocusedElement && document.body.contains(previouslyFocusedElement)) {
        // Also use timeout to restore focus just in case the modal closing animation
        // interferes with focus restoring.
        setTimeout(() => {
          previouslyFocusedElement.focus();
        }, 10);
      }
    };
  }, [isActive, ref]);
}
