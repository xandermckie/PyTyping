import { PYTHON_DOCS_URL, REAL_PYTHON_URL } from '../lib/links';
import guideSections from '../data/python-guide.json';

interface GuideSection {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  examples: string[];
}

const SECTIONS = guideSections as GuideSection[];

export default function PythonGuide() {
  return (
    <div className="mx-auto w-full max-w-5xl pb-12">
      <header className="mb-8">
        <h1 className="text-2xl font-medium text-content-primary">Python guide</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content-secondary">
          A quick reference for newcomers. Read what you need, then practice on the Exercises tab when you
          are ready — nothing here is required before you start typing.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {SECTIONS.map((section) => (
          <details
            key={section.id}
            className="group rounded-lg border border-border-tertiary bg-background-secondary"
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-content-primary marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                {section.title}
                <span className="text-xs text-content-tertiary transition-transform group-open:rotate-180">
                  ▼
                </span>
              </span>
            </summary>
            <div className="border-t border-border-tertiary px-4 py-4">
              <p className="text-sm leading-relaxed text-content-secondary">{section.summary}</p>
              {section.bullets.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-content-secondary">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
              {section.examples.map((example) => (
                <pre
                  key={example}
                  className="mt-4 overflow-x-auto rounded-md border border-border-tertiary bg-background-primary p-3 font-mono text-xs leading-relaxed text-content-primary"
                >
                  {example}
                </pre>
              ))}
              {section.id === 'next-steps' && (
                <p className="mt-4 text-sm text-content-secondary">
                  Further reading:{' '}
                  <a
                    href={PYTHON_DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    Python documentation
                  </a>{' '}
                  and{' '}
                  <a
                    href={REAL_PYTHON_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    Real Python tutorials
                  </a>
                  .
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
