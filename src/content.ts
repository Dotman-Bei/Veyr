// All marketing/explanatory copy for the page lives here as typed data;
// components only render it (frontend.md §1: content/presentation split).

import type { LucideIcon } from 'lucide-react';
import {
  Ban,
  Database,
  FileLock2,
  Gauge,
  Scale,
  ServerOff,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
}

export const navigation: NavItem[] = [
  { name: 'Board', href: '#board' },
  { name: 'How it works', href: '#how' },
  { name: 'Features', href: '#features' },
  { name: 'FAQ', href: '#faq' },
];

export const GENLAYER_DOCS = 'https://docs.genlayer.com';
export const GENLAYER_STUDIO = 'https://studio.genlayer.com';
export const GENLAYER_NETWORKS_DOCS = 'https://docs.genlayer.com/developers/networks';
export const EQUIVALENCE_DOCS =
  'https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle';

export type BentoSize = 'small' | 'medium' | 'large';

export interface Feature {
  name: string;
  description: string;
  icon: LucideIcon;
  size: BentoSize;
  highlight?: boolean;
}

/** Sizes pack a 6-col grid as L M S S / (L) M M; also clean at 4 and 2 cols. */
export const features: Feature[] = [
  {
    name: 'Consensus on the decision',
    description:
      'Every validator re-moderates the post independently. The verdict stands only when their APPROVE/REJECT matches the leader. Wording may differ; the decision may not.',
    icon: Scale,
    size: 'large',
    highlight: true,
  },
  {
    name: 'The feed is contract state',
    description: 'Posts, verdicts, counts and reputation are read straight from the Intelligent Contract. Refresh and nothing is lost.',
    icon: Database,
    size: 'medium',
  },
  {
    name: 'Injection-resistant',
    description: 'Post text sits between <post> delimiters and is declared untrusted data.',
    icon: ShieldCheck,
    size: 'small',
  },
  {
    name: 'Bounded storage',
    description: 'Posts cap at 2,000 characters, reasons at 280.',
    icon: Gauge,
    size: 'small',
  },
  {
    name: 'Rejected posts stay visible',
    description: 'A rejection is a recorded verdict, not a deletion. Anyone can audit what was refused and why.',
    icon: Ban,
    size: 'medium',
  },
  {
    name: 'No moderation server',
    description: 'No backend, database or moderation API. The browser talks to GenLayer through genlayer-js and your wallet.',
    icon: ServerOff,
    size: 'medium',
  },
];

export interface Principle {
  title: string;
  icon: LucideIcon;
  body: string;
}

export const reputationRules: Principle[] = [
  { title: 'Approved post', icon: TrendingUp, body: '+1 reputation, approved count +1' },
  { title: 'Rejected post', icon: FileLock2, body: '−1 reputation, stored with its reason' },
];

export interface Faq {
  id: string;
  question: string;
  answer: string;
  href?: string;
}

export const faqs: Faq[] = [
  {
    id: 'who-decides',
    question: 'Who decides whether my post is approved?',
    answer:
      'GenLayer validators. A leader validator runs the moderation prompt through its LLM and proposes APPROVE or REJECT; the other validators each run their own independent moderation and vote to accept the proposal only if their decision matches. There is no admin, moderation API or keyword filter.',
    href: EQUIVALENCE_DOCS,
  },
  {
    id: 'why-slow',
    question: 'Why does posting take a minute?',
    answer:
      'Your post is a transaction that several validators have to execute with real language models before consensus settles. Veyr waits for the transaction to be ACCEPTED and only then shows the verdict it reads back from the contract.',
  },
  {
    id: 'rejected',
    question: 'What happens to rejected posts?',
    answer:
      'They are stored on-chain with their category and reason, just like approved posts, and the author’s reputation drops by one. Nothing is silently discarded.',
  },
  {
    id: 'policy',
    question: 'What is the moderation policy?',
    answer:
      'A post is approved only if it is not toxic, contains no sexual or graphically violent content, is on-topic (technology, software, blockchain or GenLayer), and is not spam or pure advertising. Failing any one rule means rejection.',
  },
  {
    id: 'injection',
    question: 'Can I trick the moderator with “ignore your instructions”?',
    answer:
      'No. The contract wraps your text in <post> delimiters, escapes any delimiter tags inside it, and tells every validator that the content is untrusted data rather than instructions. The post is judged on its merits.',
  },
  {
    id: 'no-verdict',
    question: 'What if validators cannot agree?',
    answer:
      'Then no verdict is recorded. The transaction ends UNDETERMINED, nothing is written, and your reputation is untouched. Veyr shows the error and you can try again; an error is never turned into an approval.',
  },
  {
    id: 'network',
    question: 'Which network does Veyr run on, and do I need tokens?',
    answer:
      'GenLayer Studionet (chain id 61999). Your wallet will be asked to add or switch to it. Studionet is a hosted development network, so posting does not cost real funds.',
    href: GENLAYER_NETWORKS_DOCS,
  },
];

export interface FooterColumn {
  title: string;
  links: Array<{ name: string; href: string; external?: boolean }>;
}

export const footerNavigation: FooterColumn[] = [
  {
    title: 'Veyr',
    links: [
      { name: 'Board', href: '#board' },
      { name: 'How it works', href: '#how' },
      { name: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'GenLayer',
    links: [
      { name: 'Documentation', href: GENLAYER_DOCS, external: true },
      { name: 'Studio', href: GENLAYER_STUDIO, external: true },
      { name: 'Networks', href: GENLAYER_NETWORKS_DOCS, external: true },
    ],
  },
];
