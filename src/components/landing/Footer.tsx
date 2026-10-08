import { Logo } from '@/components/brand/Logo';
import { footerNavigation } from '@/content';
import { addressUrl } from '@/lib/config';
import { shortAddress } from '@/lib/utils';
import { useVeyr } from '@/state/VeyrContext';

export function Footer() {
  const { config } = useVeyr();
  const contractHref = addressUrl(config, config.contractAddress);

  return (
    <div className="mx-auto mt-6 max-w-7xl px-6 lg:px-8">
      <footer aria-labelledby="footer-heading" className="flex flex-col gap-12 border-t py-24 sm:mt-32 md:flex-row md:justify-between">
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <Logo className="size-7" />
            <span className="font-display text-lg font-extrabold">Veyr</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            A decentralized community forum moderated by GenLayer validator consensus.
          </p>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Contract{' '}
            {contractHref ? (
              <a href={contractHref} target="_blank" rel="noreferrer" className="hover:text-foreground" title={config.contractAddress}>
                {shortAddress(config.contractAddress)}
              </a>
            ) : (
              <span title={config.contractAddress}>{shortAddress(config.contractAddress)}</span>
            )}{' '}
            on {config.networkLabel}
          </p>
        </div>
        <div className="flex gap-20">
          {footerNavigation.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold leading-6">{column.title}</h3>
              <ul className="mt-6 space-y-4">
                {column.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
