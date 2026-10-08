import { ArrowRight, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVeyr } from '@/state/VeyrContext';
import { ConsensusOrbit } from './ConsensusOrbit';

/**
 * Soft warm glow behind the hero. Radial gradients instead of blurred, clipped
 * blobs: same look, but no full-screen blur filter to repaint while scrolling.
 */
function HeroGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"
      style={{
        maskImage: 'linear-gradient(to bottom, #000 60%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 60%, transparent)',
        background:
          'radial-gradient(40rem 26rem at 78% 8%, rgb(251 146 60 / 0.10), transparent 70%),' +
          'radial-gradient(34rem 24rem at 92% 30%, rgb(196 181 253 / 0.14), transparent 70%),' +
          'radial-gradient(44rem 28rem at 12% 95%, rgb(251 146 60 / 0.08), transparent 70%)',
      }}
    />
  );
}

export function Hero() {
  const { board } = useVeyr();

  return (
    <div className="relative isolate w-full">
      <HeroGlow />
      <div className="py-12 sm:py-16 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-5 sm:px-6 xl:flex-row xl:gap-12 lg:px-8">
          <div className="w-full min-w-0 max-w-2xl flex-1 text-center xl:max-w-none xl:text-left">
            <h1 className="text-[2.5rem] font-extrabold leading-[1.02] text-foreground 2xsm:text-5xl sm:text-6xl">
              Community moderation, <i className="pr-[0.08em]">settled</i> by{' '}
              <span className="font-black text-gradient-primary">validator consensus</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] text-muted-foreground sm:text-base xl:mx-0">
              Veyr is a forum where every post is judged by <strong className="text-foreground">GenLayer validators</strong>{' '}
              running their own LLM moderation. The verdict, the post and your reputation are written to an
              Intelligent Contract. No admins. No moderation API.
            </p>
            <p className="mx-auto mt-6 inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground xl:mx-0">
              <MessagesSquare className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                Board topic: <span className="font-semibold text-foreground">{board.topic ?? 'reading from contract…'}</span>
              </span>
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 2xsm:flex-row 2xsm:flex-wrap 2xsm:justify-center sm:mt-10 sm:gap-x-6 xl:justify-start">
              <Button variant="outline" size="lg" asChild>
                <a href="#how">How it works</a>
              </Button>
              <Button size="lg" asChild>
                <a href="#compose">
                  Write a post <ArrowRight aria-hidden />
                </a>
              </Button>
            </div>
          </div>
          <ConsensusOrbit className="max-w-[300px] flex-1 sm:max-w-[400px] xl:max-w-[480px]" />
        </div>
      </div>
    </div>
  );
}
