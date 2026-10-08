import { Menu } from 'lucide-react';
import { Logotype } from '@/components/brand/Logo';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { navigation } from '@/content';
import { useScrolled } from '@/hooks/useScrolled';
import { cn } from '@/lib/utils';
import { WalletButton } from './WalletButton';

/** Sticky bar that morphs into a floating rounded pill once the page scrolls. */
export function NavBar() {
  const scrolled = useScrolled(0);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'top-4 mx-4 rounded-full border bg-background/90 shadow-lg backdrop-blur-lg md:mx-20 lg:mx-10 xl:mx-30'
          : 'mx-0 border-b bg-background/80 backdrop-blur-lg',
      )}
    >
      <nav
        aria-label="Main"
        className={cn(
          'flex items-center justify-between gap-4 transition-all duration-300',
          scrolled ? 'p-3 lg:px-6' : 'p-6 lg:px-8',
        )}
      >
        <a href="#top" className="flex items-center rounded-md" aria-label="Veyr, back to top">
          <Logotype className={cn('w-auto transition-all duration-300', scrolled ? 'h-[22px]' : 'h-6')} title="Veyr" />
        </a>

        <ul className="hidden items-center gap-x-8 lg:flex">
          {navigation.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="text-sm leading-6 text-foreground transition-colors hover:text-primary">
                {item.name}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <WalletButton />
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Sheet>
            <SheetTrigger className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-foreground">
              <Menu className="size-6" aria-hidden />
              <span className="sr-only">Open main menu</span>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="flex items-center">
                <Logotype className="h-[22px]" />
              </SheetTitle>
              <SheetDescription className="sr-only">Site navigation and wallet</SheetDescription>
              <ul className="mt-4 divide-y divide-border">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <a
                        href={item.href}
                        className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 hover:bg-muted"
                      >
                        {item.name}
                      </a>
                    </SheetClose>
                  </li>
                ))}
              </ul>
              <WalletButton compact className="mt-2 self-start" />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
