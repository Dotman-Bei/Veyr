import { Toaster } from 'sonner';
import { BoardSection } from '@/components/board/BoardSection';
import { ConfigError } from '@/components/ConfigError';
import { Hero } from '@/components/landing/Hero';
import { NavBar } from '@/components/NavBar/NavBar';
import { useColorMode } from '@/hooks/useColorMode';
import { configResult } from '@/lib/config';
import { VeyrProvider } from '@/state/VeyrContext';

export default function App() {
  const { mode } = useColorMode();

  if (!configResult.ok) return <ConfigError errors={configResult.errors} />;

  return (
    <VeyrProvider config={configResult.config}>
      <div id="top" className="min-h-screen bg-background text-foreground">
        <a
          href="#board"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2"
        >
          Skip to the board
        </a>
        <NavBar />
        <div className="mx-auto max-w-(--breakpoint-2xl)">
          <main className="isolate">
            <Hero />
            <BoardSection />
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" theme={mode} richColors closeButton />
    </VeyrProvider>
  );
}
