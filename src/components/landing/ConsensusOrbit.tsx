import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVeyr } from '@/state/VeyrContext';

/** Ring diameters as a % of the box; durations in seconds. */
const RINGS = [
  { size: 38, duration: 180 },
  { size: 58, duration: 300 },
  { size: 78, duration: 420 },
  { size: 98, duration: 600 },
];

/** Decorative validator nodes riding three of the rings (not live telemetry). */
const NODES = [
  { ring: 1, angle: 20, duration: 70 },
  { ring: 1, angle: 200, duration: 70 },
  { ring: 2, angle: 110, duration: 110 },
  { ring: 2, angle: 290, duration: 110 },
  { ring: 3, angle: 60, duration: 160 },
];

function Ring({ size, duration }: { size: number; duration: number }) {
  return (
    <div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:animate-ring-spin"
      style={
        {
          width: `${size}%`,
          height: `${size}%`,
          '--orbit-duration': `${duration}s`,
          background: 'conic-gradient(from 0deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.02), hsl(var(--primary) / 0.2))',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px))',
        } as CSSProperties
      }
    />
  );
}

function Node({ ring, angle, duration }: (typeof NODES)[number]) {
  const size = RINGS[ring].size;
  const vars = { '--orbit-duration': `${duration}s` } as CSSProperties;
  return (
    <div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: `${size}%`, height: `${size}%` }}
    >
      <div className="size-full" style={{ transform: `rotate(${angle}deg)` }}>
        <div className="relative size-full motion-safe:animate-orbit-spin" style={vars}>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="motion-safe:animate-orbit-counter-spin" style={vars}>
              <div
                className="flex size-9 items-center justify-center rounded-full border bg-background shadow-md sm:size-11"
                style={{ transform: `rotate(${-angle}deg)` }}
              >
                <Bot className="size-4 text-primary sm:size-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Hero visual: validators orbiting the live on-chain approval count. */
export function ConsensusOrbit({ className }: { className?: string }) {
  const { board } = useVeyr();
  const stats = board.stats;
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Nine infinite animations are cheap but not free: pause them while offscreen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-paused={visible ? undefined : ''}
      className={cn(
        'relative mx-auto aspect-square w-full max-w-[500px] overflow-hidden [contain:layout_paint] [&[data-paused]_*]:[animation-play-state:paused]',
        className,
      )}
    >
      {RINGS.map((ring) => (
        <Ring key={ring.size} {...ring} />
      ))}
      {NODES.map((node) => (
        <Node key={`${node.ring}-${node.angle}`} {...node} />
      ))}
      <div className="absolute left-1/2 top-1/2 flex w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
        <span className="font-display text-4xl font-black tabular-nums text-gradient-primary sm:text-6xl">
          {stats ? `${stats.approved}/${stats.total}` : '—'}
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
          posts approved on-chain
        </span>
      </div>
    </div>
  );
}
