import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "../icons";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { registerDialog, hasOpenDialog } from "../../services/overlay";

import { Button } from "./Button";
import "./Modal.css";
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
  width?: number | string;
  busy?: boolean;
  showCloseButton?: boolean;
  restoreFocusRef?: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
}
export function Modal({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
  width = 540,
  busy = false,
  showCloseButton = true,
  restoreFocusRef,
  initialFocusRef,
}: ModalProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = () => {
    if (!busy) onClose();
  };
  useEffect(() => {
    if (isOpen) return registerDialog(id, () => closeRef.current());
  }, [isOpen, id]);
  useEffect(() => {
    if (!isOpen || !restoreFocusRef) return;
    return () => {
      // Menu items disappear when a confirmation opens. Return to their stable trigger.
      setTimeout(() => {
        // An older dialog must not move focus outside a newer dialog.
        if (!hasOpenDialog() && restoreFocusRef.current?.isConnected)
          restoreFocusRef.current.focus();
      }, 0);
    };
  }, [isOpen, restoreFocusRef]);
  useFocusTrap(dialogRef, isOpen, initialFocusRef);
  const body = (
    <>
      {title && (
        <div className="modal-header">
          <h2 id={id + "-title"} className="modal-title">
            {title}
          </h2>
          {showCloseButton && (
            <Button
              variant="ghost"
              onClick={() => closeRef.current()}
              disabled={busy}
              aria-label="Close dialog"
            >
              <X size={20} />
            </Button>
          )}
        </div>
      )}
      <div className="app-dialog-content modal-body">{children}</div>
    </>
  );

  if (!isOpen) return null;
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRef.current();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") closeRef.current();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? id + "-title" : undefined}
        tabIndex={-1}
        className="modal-panel"
        style={{ width }}
      >
        {body}
      </div>
    </div>,
    document.body
  );
}
