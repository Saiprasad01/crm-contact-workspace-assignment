import { messageBus } from '@/utils/pubsub';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import styles from './modal.module.scss';

interface ModalState {
  content: ReactNode;
  modifierClass?: string;
  ariaLabel?: string;
}

/**
 * Global, event-driven modal (mirrors ai-media-cpcm-frontend-ui's
 * `components/modal` + messageBus pattern instead of per-screen local state
 * or a UI-kit's <Dialog>). Mounted once from `pages/_app.tsx`; anywhere else
 * calls `openModal`/`closeModal`. Handles focus trap, ESC-to-close, and
 * returning focus to whatever opened it.
 */
export default function ModalRoot() {
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const subId = messageBus.subscribe('app__modal', (event) => {
      if (event?.event_name === 'OPEN_MODAL') {
        triggerElementRef.current = document.activeElement as HTMLElement | null;
        setModalState({
          content: event.data,
          modifierClass: event.modifier_class,
          ariaLabel: event.aria_label,
        });
      } else if (event?.event_name === 'CLOSE_MODAL') {
        setModalState(null);
      }
    });
    return () => messageBus.unsubscribe('app__modal', subId);
  }, []);

  const close = () => {
    setModalState(null);
    triggerElementRef.current?.focus?.();
  };

  useEffect(() => {
    if (!modalState) return undefined;

    const dialogEl = dialogRef.current;
    const focusable = dialogEl?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab' || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalState]);

  if (!modalState) return null;

  return (
    <div className={styles.overlay} onMouseDown={close}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${(modalState.modifierClass && styles[modalState.modifierClass]) || ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={modalState.ariaLabel}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {modalState.content}
      </div>
    </div>
  );
}

export function openModal(content: ReactNode, modifierClass?: string, ariaLabel?: string): void {
  messageBus.publish('app__modal', {
    event_name: 'OPEN_MODAL',
    data: content,
    modifier_class: modifierClass,
    aria_label: ariaLabel,
  });
}

export function closeModal(): void {
  messageBus.publish('app__modal', { event_name: 'CLOSE_MODAL' });
}
