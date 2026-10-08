import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { features, type BentoSize } from '@/content';
import { cn } from '@/lib/utils';
import { SectionTitle } from './SectionTitle';

const SIZE: Record<BentoSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-2 row-span-2',
};

/** Warm, borderless bento tiles (frontend.md §6.4). Size classes live on the grid child only. */
export function FeaturesGrid() {
  return (
    <section id="features" aria-labelledby="features-title" className="mx-auto my-16 max-w-7xl scroll-mt-24 md:my-24 lg:my-40">
      <SectionTitle
        id="features-title"
        eyebrow="Features"
        title="Small surface, real guarantees"
        description="Veyr keeps the product tiny so the moderation loop itself can be trusted."
        className="px-6"
      />
      <div className="mx-4 mt-16 grid auto-rows-[minmax(140px,auto)] grid-cols-2 gap-4 md:mx-6 md:grid-cols-4 lg:mx-8 lg:grid-cols-6">
        {features.map((feature) => (
          <Card
            key={feature.name}
            variant={feature.highlight ? 'bentoHighlight' : 'bento'}
            className={cn('flex flex-col justify-center p-6', SIZE[feature.size], feature.highlight && 'order-last md:order-none')}
          >
            <feature.icon
              className={cn(
                'mb-4 text-primary',
                feature.size === 'large' ? 'size-12' : 'size-7',
              )}
              aria-hidden
            />
            <CardTitle className={cn(feature.size === 'large' && 'text-2xl font-black')}>{feature.name}</CardTitle>
            <CardDescription className={cn('mt-2', feature.size === 'large' && 'text-sm')}>{feature.description}</CardDescription>
          </Card>
        ))}
      </div>
    </section>
  );
}
