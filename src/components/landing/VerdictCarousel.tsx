import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CategoryBadge, VerdictBadge } from '@/components/board/VerdictBadge';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn, shortAddress } from '@/lib/utils';
import { useVeyr } from '@/state/VeyrContext';

const ADVANCE_MS = 3000;
// Phones/tablets: pad so any card can sit centred. Desktop: start flush with the content column.
const STRIP =
  'no-scrollbar flex gap-4 px-[calc(50%-140px)] pb-10 pt-4 sm:px-[calc(50%-160px)] md:px-[calc(50%-175px)] lg:px-[max(2rem,calc(50%-38rem))]';
const CARD_WIDTH = 'w-[280px] sm:w-[320px] md:w-[350px]';
const MAX_CARDS = 8;

/**
 * Full-bleed snap carousel of the latest on-chain verdicts. Auto-advances only
 * while visible, pauses on hover or keyboard focus, has a pause control, and
 * never auto-advances under prefers-reduced-motion.
 */
export function VerdictCarousel() {
  const { board } = useVeyr();
  const posts = board.posts.slice(0, MAX_CARDS);
  const reducedMotion = usePrefersReducedMotion();
  const [current, setCurrent] = useState(0);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const section = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLAnchorElement | null>>([]);

  const hasPosts = posts.length > 0;
  const autoplay = inView && !hovered && !paused && !reducedMotion && posts.length > 1;

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.5,
      rootMargin: '-200px 0px -100px 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
    // The section only mounts once posts exist, so re-observe when that flips.
  }, [hasPosts]);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => setCurrent((c) => (c + 1) % posts.length), ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [autoplay, posts.length]);

  // Centre the current card inside the strip without moving the page.
  const centre = useCallback(
    (index: number) => {
      const container = strip.current;
      const card = cards.current[index];
      if (!container || !card) return;
      const left = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
      container.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion],
  );

  useEffect(() => {
    if (inView) centre(current);
  }, [current, inView, centre]);

  if (!hasPosts) {
    // Reserve the strip's space while chain data loads so nothing jumps when it arrives.
    if (!board.loading) return null;
    return (
      <section aria-hidden className="relative left-1/2 my-12 w-screen -translate-x-1/2 sm:my-16">
        <div className="mx-auto h-6 max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className={cn(STRIP, 'overflow-hidden')}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn(CARD_WIDTH, 'h-[170px] shrink-0 animate-pulse rounded-xl border bg-card', i > 0 && 'opacity-50')} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={section} aria-label="Latest on-chain verdicts" className="relative left-1/2 my-12 w-screen -translate-x-1/2 sm:my-16">
      <div className="mx-auto flex h-6 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <p className="font-semibold tracking-wide text-muted-foreground">
          <span className="sm:hidden">Latest verdicts:</span>
          <span className="hidden sm:inline">Latest verdicts, straight from the contract:</span>
        </p>
        {!reducedMotion && posts.length > 1 && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:px-3 pointer-coarse:py-2.5"
            aria-pressed={paused}
          >
            {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
            {paused ? 'Play' : 'Pause'}
          </button>
        )}
      </div>
      <div
        ref={strip}
        className={cn(STRIP, 'snap-x snap-mandatory overflow-x-auto')}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovered(false);
        }}
      >
        {posts.map((post, i) => (
          <a
            key={post.index}
            ref={(el) => {
              cards.current[i] = el;
            }}
            href={`#post-${post.index}`}
            onMouseEnter={() => {
              setHovered(true);
              setCurrent(i);
            }}
            onFocus={() => setCurrent(i)}
            className={cn(CARD_WIDTH, 'shrink-0 snap-center rounded-xl transition-transform duration-200 hover:scale-105')}
          >
            <Card variant={i === current ? 'default' : 'faded'} className="flex h-full flex-col p-5">
              <div className="flex items-center gap-2">
                <VerdictBadge approved={post.approved} />
                <CategoryBadge category={post.category} />
                <span className="ml-auto font-mono text-xs text-muted-foreground">#{post.index}</span>
              </div>
              <div className={cn('mt-3 line-clamp-3 text-sm font-semibold', !post.approved && 'text-muted-foreground')}>
                {post.text}
              </div>
              <p className="mt-auto pt-3 text-xs text-muted-foreground">
                <span className="line-clamp-2">{post.reason}</span>
                <span className="mt-1 block font-mono">by {shortAddress(post.author)}</span>
              </p>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
