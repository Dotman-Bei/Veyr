import { useState } from 'react';
import type { Post } from '@/lib/genlayer';
import { SectionTitle } from '@/components/landing/SectionTitle';
import { Composer } from './Composer';
import { Feed } from './Feed';
import { StatsRow } from './StatsRow';

export function BoardSection() {
  const [highlight, setHighlight] = useState<number | undefined>();

  return (
    <section id="board" aria-labelledby="board-title" className="mx-auto mt-24 max-w-7xl scroll-mt-24 px-6 lg:px-8">
      <SectionTitle
        id="board-title"
        eyebrow="The board"
        title={
          <>
            Post it. Let the <span className="text-gradient-primary">validators</span> decide.
          </>
        }
        description="Everything below is read live from the Veyr Intelligent Contract on GenLayer. Submit a post and watch consensus settle its verdict."
      />
      <div className="mt-12">
        <StatsRow />
      </div>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="lg:sticky lg:top-28">
          <Composer onSettled={(post: Post) => setHighlight(post.index)} />
        </div>
        <Feed highlightIndex={highlight} />
      </div>
    </section>
  );
}
