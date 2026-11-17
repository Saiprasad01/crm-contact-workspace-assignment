import { messageBus } from '@/utils/pubsub';
import { useEffect, useRef, useState } from 'react';
import styles from './app-toast.module.scss';

type ToastTone = 'success' | 'error';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

const DISPLAY_MS = 5000;

/** Global save-feedback toast, event-driven like the modal. An `aria-live`
 * region so screen readers announce save success/failure without the user
 * needing to find the toast visually. Each toast gets a fresh `id` (not just
 * message+tone) so a slide-in animation replays even for back-to-back saves,
 * and it's dismissible early rather than only timing out. */
export default function AppToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextIdRef = useRef(0);

  useEffect(() => {
    const subId = messageBus.subscribe('app__toast', (event) => {
      if (event?.event_name === 'SHOW_TOAST') {
        setToast({
          id: ++nextIdRef.current,
          message: event.data?.message,
          tone: event.data?.tone || 'success',
        });
      }
    });
    return () => messageBus.unsubscribe('app__toast', subId);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className={styles.region} aria-live="polite" role="status">
      {toast ? (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.tone] || ''}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className={styles.dismiss}
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function showToast(message: string, tone: ToastTone = 'success'): void {
  messageBus.publish('app__toast', { event_name: 'SHOW_TOAST', data: { message, tone } });
}
