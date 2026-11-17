import AppHeader from '@/components/app-header/app-header';
import AppToast from '@/components/app-toast/app-toast';
import ErrorBoundary from '@/components/error-boundary/error-boundary';
import ModalRoot from '@/components/modal/modal';
import '@/styles/main.scss';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link visually-hidden">
        Skip to main content
      </a>
      <AppHeader />
      <Component {...pageProps} />
      <ModalRoot />
      <AppToast />
    </ErrorBoundary>
  );
}
