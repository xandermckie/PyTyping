import {
  AUTOMATE_BORING_STUFF_URL,
  COREY_SCHAFER_URL,
  CS50P_URL,
  EXERCISM_PYTHON_URL,
  LEETCODE_URL,
  MOSH_PYTHON_URL,
  PYTHON_DISCORD_URL,
  PYTHON_DOCS_URL,
  PYTHON_STANDARD_LIBRARY_URL,
  PYTHON_TUTORIAL_URL,
  REAL_PYTHON_URL,
  STACK_OVERFLOW_PYTHON_URL,
  TECH_WITH_TIM_URL,
} from '../lib/links';
import guideSections from '../data/python-guide.json';

interface Resource {
  label: string;
  url: string;
  description: string;
  tag: string;
}

const RESOURCE_GROUPS: Array<{ heading: string; items: Resource[] }> = [
  {
    heading: 'Official documentation',
    items: [
      { label: 'Python 3 Docs', url: PYTHON_DOCS_URL, description: 'The authoritative reference for every built-in, keyword, and module.', tag: 'Reference' },
      { label: 'Official Tutorial', url: PYTHON_TUTORIAL_URL, description: 'The guided tour written by the core team — great first read.', tag: 'Tutorial' },
      { label: 'Standard Library', url: PYTHON_STANDARD_LIBRARY_URL, description: 'Every module that ships with Python, with full API docs.', tag: 'Reference' },
    ],
  },
  {
    heading: 'Books & courses',
    items: [
      { label: 'Automate the Boring Stuff', url: AUTOMATE_BORING_STUFF_URL, description: 'Free online book by Al Sweigart — practical Python for real-world automation.', tag: 'Book · Free' },
      { label: 'CS50P (Harvard)', url: CS50P_URL, description: "Harvard's free Python course with lectures, problem sets, and a certificate.", tag: 'Course · Free' },
      { label: 'Real Python', url: REAL_PYTHON_URL, description: 'In-depth tutorials from beginner to advanced, updated regularly.', tag: 'Tutorials' },
    ],
  },
  {
    heading: 'YouTube playlists',
    items: [
      { label: 'Mosh Hamedani — Python for Beginners', url: MOSH_PYTHON_URL, description: '6-hour crash course covering all the fundamentals in one sitting.', tag: 'YouTube' },
      { label: 'Corey Schafer — Python Tutorials', url: COREY_SCHAFER_URL, description: 'Deep-dive series on core Python, OOP, decorators, generators, and more.', tag: 'YouTube' },
      { label: 'Tech With Tim — Python Beginner', url: TECH_WITH_TIM_URL, description: 'Fast-paced beginner playlist; good for visual learners who like short videos.', tag: 'YouTube' },
    ],
  },
  {
    heading: 'Practice & community',
    items: [
      { label: 'Exercism — Python track', url: EXERCISM_PYTHON_URL, description: 'Coding exercises with optional mentorship from experienced Pythonistas.', tag: 'Practice' },
      { label: 'LeetCode — Easy problems', url: LEETCODE_URL, description: 'Algorithm challenges; start Easy to build pattern recognition without frustration.', tag: 'Practice' },
      { label: 'Python Discord', url: PYTHON_DISCORD_URL, description: 'Active community for asking questions, sharing projects, and finding study groups.', tag: 'Community' },
      { label: 'Stack Overflow — python tag', url: STACK_OVERFLOW_PYTHON_URL, description: 'Search before posting — almost every beginner question has an answer here.', tag: 'Community' },
    ],
  },
];

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

      {/* Learning resources */}
      <section className="mt-12">
        <h2 className="mb-1 text-lg font-semibold text-content-primary">Learning resources</h2>
        <p className="mb-8 text-sm text-content-secondary">
          Handpicked documentation, courses, videos, and communities to take you further.
        </p>
        <div className="flex flex-col gap-10">
          {RESOURCE_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-content-tertiary">
                {group.heading}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.items.map((resource) => (
                  <a
                    key={resource.url}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-lg border border-border-tertiary bg-background-secondary p-4 transition-all duration-150 hover:border-border-secondary hover:bg-background-tertiary hover:shadow-[var(--shadow-sm)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-content-primary group-hover:text-accent transition-colors duration-150">
                        {resource.label}
                      </span>
                      <span className="shrink-0 rounded-md bg-background-primary px-2 py-0.5 text-xs text-content-tertiary border border-border-tertiary">
                        {resource.tag}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
                      {resource.description}
                    </p>
                    <span className="mt-3 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
                      Open ↗
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
