import {
  AUTHOR_NAME,
  GITHUB_BUG_REPORT_URL,
  GITHUB_EXERCISE_SUGGESTION_URL,
  GITHUB_LANGUAGE_REQUEST_URL,
  GITHUB_REPO_URL,
} from '../lib/links';

interface ContributeCard {
  title: string;
  description: string;
  cta: string;
  url: string;
  accent?: boolean;
}

const CARDS: ContributeCard[] = [
  {
    title: 'Request a new language',
    description:
      'Want JavaScript, Rust, SQL, or something else? Open an issue and tell us which language and why — popular requests get built first.',
    cta: 'Request a language →',
    url: GITHUB_LANGUAGE_REQUEST_URL,
    accent: true,
  },
  {
    title: 'Suggest an improvement',
    description:
      'Found a bug, a typo, or an exercise that could be clearer? Open an issue on GitHub and describe what you expected vs. what happened.',
    cta: 'Report a bug →',
    url: GITHUB_BUG_REPORT_URL,
  },
  {
    title: 'Propose a new exercise',
    description:
      'Have a Python snippet you wish was in the library? Share the code and a plain-language explanation in a GitHub issue and we\'ll consider adding it.',
    cta: 'Suggest an exercise →',
    url: GITHUB_EXERCISE_SUGGESTION_URL,
  },
  {
    title: 'Browse the source',
    description:
      'PyTyping is open source. Fork it, poke around, or submit a pull request if you want to contribute code directly.',
    cta: 'View on GitHub →',
    url: GITHUB_REPO_URL,
  },
];

export default function Contribute() {
  return (
    <div className="mx-auto w-full max-w-3xl pb-16">
      <header className="py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-content-primary sm:text-4xl">
          Help shape PyTyping
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-content-secondary">
          PyTyping is built in public by{' '}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            {AUTHOR_NAME}
          </a>
          . The best way to get something added or changed is to open a GitHub issue — no account
          setup required beyond a free GitHub login.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <a
            key={card.title}
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex flex-col rounded-lg border p-5 transition-all duration-150 hover:shadow-[var(--shadow-sm)] ${
              card.accent
                ? 'border-accent/30 bg-[var(--color-accent-subtle)] hover:border-accent/50'
                : 'border-border-tertiary bg-background-secondary hover:border-border-secondary hover:bg-background-tertiary'
            }`}
          >
            <h2
              className={`text-sm font-semibold transition-colors duration-150 group-hover:text-accent ${
                card.accent ? 'text-accent' : 'text-content-primary'
              }`}
            >
              {card.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-content-secondary">
              {card.description}
            </p>
            <span className="mt-4 text-xs font-medium text-accent">{card.cta}</span>
          </a>
        ))}
      </div>

      <section className="mt-12 rounded-lg border border-border-tertiary bg-background-secondary p-6">
        <h2 className="mb-1 text-sm font-semibold text-content-primary">How requests are prioritised</h2>
        <p className="text-sm leading-relaxed text-content-secondary">
          New languages are added when there is enough demand and a clear exercise set to go with
          them. Thumbs-up reactions on a GitHub issue are the fastest signal — they tell us what
          matters to the most people. Bug fixes and typo corrections are always merged quickly.
        </p>
      </section>
    </div>
  );
}
