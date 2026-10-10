import { useEffect, useId, useState } from 'react';
import { AlertCircle, AlertTriangle, Ban, Clock, ExternalLink, KeyRound, Loader2, Send, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { txUrl } from '@/lib/config';
import { COOLDOWN_SECONDS, MAX_POST_CHARS, type Post } from '@/lib/genlayer';
import { cn, shortAddress } from '@/lib/utils';
import { useVeyr } from '@/state/VeyrContext';
import { useSubmission } from '@/state/useSubmission';
import { ConsensusProgress } from './ConsensusProgress';
import { VerdictResult } from './VerdictResult';

const RULES = ['Not toxic', 'No sexual or graphic violence', 'On-topic for the board', 'Not spam or ads'];

/** Wall-clock seconds, ticking once a second while `active`. */
function useNowSeconds(active: boolean) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

function formatWait(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function Composer({ onSettled }: { onSettled: (post: Post) => void }) {
  const { config, contract, wallet, board, reputation } = useVeyr();
  const [text, setText] = useState('');
  const counterId = useId();

  const { state, submit, reset, busy } = useSubmission({
    contract,
    signer: wallet.signer,
    signerAddress: wallet.signerAddress,
    prepareToSign: wallet.prepareToSign,
    refreshBoard: board.refresh,
    onSettled: (post) => {
      setText('');
      reputation.reload();
      onSettled(post);
      toast[post.approved ? 'success' : 'error'](post.approved ? 'Post approved by consensus' : 'Post rejected by consensus', {
        description: post.reason,
      });
    },
  });

  // The contract enforces these; showing them here saves a wasted signature.
  const standing = reputation.standing;
  const now = useNowSeconds(Boolean(standing && (standing.suspendedUntil || standing.lastPostAt)));
  const suspendedFor = standing ? Math.max(0, standing.suspendedUntil - now) : 0;
  const cooldownFor = standing?.lastPostAt ? Math.max(0, standing.lastPostAt + COOLDOWN_SECONDS - now) : 0;
  const blocked = suspendedFor > 0 || cooldownFor > 0;

  const length = text.trim().length;
  const over = length > MAX_POST_CHARS;
  const canSubmit = Boolean(wallet.signer) && !wallet.wrongNetwork && length > 0 && !over && !busy && !blocked;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) submit(text);
  };

  let action: React.ReactNode;
  if (!wallet.signer) {
    action = wallet.hasWallet ? (
      <Button type="button" onClick={() => wallet.connect().catch((err) => toast.error(err.message))} disabled={wallet.connecting}>
        {wallet.connecting ? <Loader2 className="animate-spin" aria-hidden /> : <Wallet aria-hidden />}
        Connect wallet to post
      </Button>
    ) : (
      <Button type="button" variant="outline" asChild>
        <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
          <Wallet aria-hidden /> Install a wallet to post
        </a>
      </Button>
    );
  } else if (wallet.wrongNetwork) {
    action = (
      <Button type="button" variant="outline" className="border-warning/50 text-warning" onClick={() => wallet.switchNetwork().catch((err) => toast.error(err.message))}>
        <AlertTriangle aria-hidden /> Switch to {config.networkLabel.replace('GenLayer ', '')}
      </Button>
    );
  } else {
    action = (
      <Button type="submit" disabled={!canSubmit}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {state.phase === 'signing'
          ? 'Confirm in wallet…'
          : state.phase === 'pending'
            ? 'Moderating…'
            : suspendedFor > 0
              ? 'Suspended'
              : cooldownFor > 0
                ? `Wait ${formatWait(cooldownFor)}`
                : 'Submit for moderation'}
      </Button>
    );
  }

  return (
    <Card variant="static" id="compose" className="scroll-mt-28 p-5 sm:p-6">
      <form onSubmit={onSubmit} aria-busy={busy}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-2xl">Write a post</h3>
          <span className="text-xs text-muted-foreground">
            Topic: <span className="font-semibold text-foreground">{board.topic ?? '…'}</span>
          </span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Board policy">
          {RULES.map((rule) => (
            <li key={rule} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {rule}
            </li>
          ))}
        </ul>

        <label htmlFor="post-text" className="sr-only">
          Post text
        </label>
        <Textarea
          id="post-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          placeholder="Share something about technology, software, blockchain or GenLayer…"
          aria-describedby={counterId}
          aria-invalid={over || undefined}
          className="mt-4 font-sans"
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5">
            {wallet.signer?.kind === 'dev-key' && <KeyRound className="size-3.5 shrink-0" aria-hidden />}
            {wallet.signerAddress ? (
              <span className="truncate">
                Signing as <span className="font-mono">{shortAddress(wallet.signerAddress)}</span>
                {wallet.signer?.kind === 'dev-key' && ' (dev key)'}
              </span>
            ) : (
              'Posts are signed by your wallet'
            )}
          </span>
          <span id={counterId} className={cn('shrink-0 font-mono tabular-nums', over && 'font-semibold text-destructive')}>
            {length}/{MAX_POST_CHARS}
          </span>
        </div>

        {wallet.signer && suspendedFor > 0 && (
          <div role="status" className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
            <Ban className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
            <span>
              Suspended for {formatWait(suspendedFor)}: three net rejections (reputation {standing?.reputation}) pause posting for 24 hours, and
              each further rejection suspends you again. Approved posts rebuild your reputation.
            </span>
          </div>
        )}
        {wallet.signer && !suspendedFor && cooldownFor > 0 && !busy && state.phase !== 'settled' && (
          <p role="status" className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden /> One post per minute per author. Duplicate text is refused before moderation.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">{action}</div>
      </form>

      <div className="mt-5 empty:hidden">
        {state.phase === 'signing' && (
          <div role="status" className="flex items-center gap-3 rounded-xl border p-4 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {wallet.signer?.kind === 'wallet' ? 'Confirm the transaction in your wallet…' : 'Sending transaction…'}
          </div>
        )}
        {state.phase === 'pending' && (
          <ConsensusProgress hash={state.hash} stage={state.stage} chainStatus={state.chainStatus} startedAt={state.startedAt} />
        )}
        {state.phase === 'settled' && <VerdictResult post={state.post} hash={state.hash} onDone={reset} />}
        {state.phase === 'failed' && (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">No verdict was recorded</div>
                <div className="mt-1 text-muted-foreground">{state.error.message}</div>
                {state.hash && txUrl(config, state.hash) && (
                  <a
                    href={txUrl(config, state.hash)!}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-mono text-xs underline-offset-2 hover:underline"
                  >
                    {shortAddress(state.hash, 8)} <ExternalLink className="size-3" aria-hidden />
                  </a>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={reset}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
