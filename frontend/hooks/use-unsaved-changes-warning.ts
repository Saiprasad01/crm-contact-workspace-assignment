import { useRouter } from 'next/router';
import { useEffect } from 'react';

const DEFAULT_MESSAGE = 'You have unsaved changes. Leave this page anyway?';

/** Protects an unsaved edit on navigation: a native confirm on tab close/
 * refresh (`beforeunload`), and a confirm on in-app navigation via the
 * documented pages-router trick of throwing inside `routeChangeStart` to
 * cancel it (there's no `useBlocker` outside the app router / react-router). */
export function useUnsavedChangesWarning(isDirty: boolean, message: string = DEFAULT_MESSAGE): void {
  const router = useRouter();

  useEffect(() => {
    if (!isDirty) return undefined;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const handleRouteChangeStart = () => {
      if (!window.confirm(message)) {
        router.events.emit('routeChangeError');
        // Throwing is the documented way to abort a pages-router navigation
        // (https://github.com/vercel/next.js/issues/2476). The console
        // warning this produces is expected and safe to ignore.
        throw 'Route change aborted (unsaved changes).';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [isDirty, message, router]);
}
