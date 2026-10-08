import { AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

/** Shown instead of the app when env configuration is missing or invalid. */
export function ConfigError({ errors }: { errors: string[] }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-2xl">Veyr is not configured</h1>
        </div>
        <ul className="mt-6 space-y-3">
          {errors.map((error) => (
            <li key={error} className="flex gap-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>{error}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">
          Copy <code>.env.example</code> to <code>.env</code>, fill in the values, and restart the dev server.
        </p>
      </div>
    </main>
  );
}
