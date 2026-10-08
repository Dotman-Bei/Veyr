import { ArrowRight, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVeyr } from '@/state/VeyrContext';
import { ConsensusOrbit } from './ConsensusOrbit';

function TopGradient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 -z-10 w-full transform-gpu overflow-hidden blur-3xl dark:hidden sm:top-[-20rem]"
    >
      <div
        className="relative left-[calc(50%+6rem)] aspect-[1155/678] w-[36rem] bg-linear-to-tr from-orange-400 to-violet-300 opacity-10 sm:w-[72rem]"
        style={{
          clipPath:
            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
        }}
      />
    </div>
  );
}

function BottomGradient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-[calc(100%-40rem)] -z-10 transform-gpu overflow-hidden blur-3xl dark:hidden sm:top-[calc(100%-65rem)]"
    >
      <div
        className="relative aspect-[1155/678] w-[36rem] bg-linear-to-br from-orange-400 to-violet-300 opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72rem]"
        style={{ clipPath: 'ellipse(80% 48% at 45% 50%)' }}
      />
    </div>
  );
}

export function Hero() {
  const { board } = useVeyr();

  return (
    <div className="relative w-full pt-14">
      <TopGradient />
      <BottomGradient />
      <div className="md:p-24">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-14 px-6 lg:flex-row lg:gap-10 lg:px-8">
          <div className="w-full min-w-0 max-w-3xl flex-1 text-center md:text-left">
            <h1 className="text-5xl font-extrabold leading-none text-foreground md:text-6xl">
              Community moderation, <i className="pr-[0.08em]">settled</i> by{' '}
              <span className="font-black text-gradient-primary">validator consensus</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:mx-0">
              Veyr is a forum where every post is judged by <strong className="text-foreground">GenLayer validators</strong>{' '}
              running their own LLM moderation. The verdict, the post and your reputation are written to an
              Intelligent Contract. No admins. No moderation API.
            </p>
            <p className="mx-auto mt-6 inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground md:mx-0">
              <MessagesSquare className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                Board topic: <span className="font-semibold text-foreground">{board.topic ?? 'reading from contract…'}</span>
              </span>
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 md:justify-start">
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
          <ConsensusOrbit className="max-w-[340px] flex-1 sm:max-w-[440px] lg:max-w-[500px]" />
        </div>
      </div>
    </div>
  );
}
