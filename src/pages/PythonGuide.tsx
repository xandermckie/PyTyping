import {
  AUTOMATE_BORING_STUFF_URL,
  COREY_SCHAFER_URL,
  CS50P_URL,
  EXERCISM_PYTHON_URL,
  GITHUB_CODESPACES_URL,
  GITHUB_HELLO_WORLD_URL,
  GITHUB_SIGNUP_URL,
  LEETCODE_URL,
  MOSH_PYTHON_URL,
  PYCHARM_URL,
  PYTHON_DISCORD_URL,
  PYTHON_DOCS_URL,
  PYTHON_STANDARD_LIBRARY_URL,
  PYTHON_TUTORIAL_URL,
  REAL_PYTHON_URL,
  REPLIT_URL,
  STACK_OVERFLOW_PYTHON_URL,
  TECH_WITH_TIM_URL,
  THONNY_URL,
  VSCODE_URL,
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
      { label: 'Python 3 Docs', url: PYTHON_DOCS_URL, description: 'Reference for built-ins, keywords, and modules.', tag: 'Reference' },
      { label: 'Official Tutorial', url: PYTHON_TUTORIAL_URL, description: 'Guided tour from the core team. Good first read.', tag: 'Tutorial' },
      { label: 'Standard Library', url: PYTHON_STANDARD_LIBRARY_URL, description: 'Every module that ships with Python, with API docs.', tag: 'Reference' },
    ],
  },
  {
    heading: 'Books & courses',
    items: [
      { label: 'Automate the Boring Stuff', url: AUTOMATE_BORING_STUFF_URL, description: 'Free online book by Al Sweigart about practical automation.', tag: 'Book · Free' },
      { label: 'CS50P (Harvard)', url: CS50P_URL, description: "Harvard's free Python course with lectures and problem sets.", tag: 'Course · Free' },
      { label: 'Real Python', url: REAL_PYTHON_URL, description: 'Tutorials from beginner to advanced.', tag: 'Tutorials' },
    ],
  },
  {
    heading: 'YouTube playlists',
    items: [
      { label: 'Mosh Hamedani: Python for Beginners', url: MOSH_PYTHON_URL, description: 'About six hours covering the basics.', tag: 'YouTube' },
      { label: 'Corey Schafer: Python Tutorials', url: COREY_SCHAFER_URL, description: 'Video series on Python, OOP, decorators, generators, and more.', tag: 'YouTube' },
      { label: 'Tech With Tim: Python Beginner', url: TECH_WITH_TIM_URL, description: 'Short beginner videos.', tag: 'YouTube' },
    ],
  },
  {
    heading: 'IDEs & environments',
    items: [
      { label: 'VS Code', url: VSCODE_URL, description: 'Free editor with Python support via the Microsoft extension.', tag: 'Editor · Free' },
      { label: 'PyCharm Community', url: PYCHARM_URL, description: 'Free Python IDE from JetBrains with debugger and refactoring.', tag: 'IDE · Free' },
      { label: 'Thonny', url: THONNY_URL, description: 'Small IDE for beginners. Shows variable values and steps through code.', tag: 'IDE · Free' },
      { label: 'Replit', url: REPLIT_URL, description: 'Browser IDE for trying code without installing anything locally.', tag: 'Online · Free' },
      { label: 'GitHub Codespaces', url: GITHUB_CODESPACES_URL, description: 'VS Code in the cloud, set up per repo.', tag: 'Online' },
    ],
  },
  {
    heading: 'GitHub & version control',
    items: [
      { label: 'Create a GitHub account', url: GITHUB_SIGNUP_URL, description: 'Free account with public and private repos.', tag: 'Free' },
      { label: 'GitHub: Hello World', url: GITHUB_HELLO_WORLD_URL, description: "GitHub's short guide to repos, branches, and pull requests.", tag: 'Guide' },
    ],
  },
  {
    heading: 'Practice & community',
    items: [
      { label: 'Exercism: Python track', url: EXERCISM_PYTHON_URL, description: 'Coding exercises with optional mentorship.', tag: 'Practice' },
      { label: 'LeetCode: Easy problems', url: LEETCODE_URL, description: 'Algorithm problems. Start with Easy.', tag: 'Practice' },
      { label: 'Python Discord', url: PYTHON_DISCORD_URL, description: 'Chat for questions and project help.', tag: 'Community' },
      { label: 'Stack Overflow: python tag', url: STACK_OVERFLOW_PYTHON_URL, description: 'Search before you post. Most beginner questions are already answered.', tag: 'Community' },
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
          Quick reference for newcomers. Read what you need, then practice on the Exercises tab. Nothing
          here is required before you start typing.
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
                <span className="text-content-tertiary transition-transform group-open:rotate-180">▾</span>
              </span>
            </summary>
            <div className="border-t border-border-tertiary px-4 py-4">
              <p className="text-sm leading-relaxed text-content-secondary">{section.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-content-secondary">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              {section.examples.length > 0 && (
                <pre
                  className="mt-4 overflow-x-auto rounded-md border border-border-tertiary bg-background-primary p-3 font-mono text-xs leading-relaxed text-content-primary"
                  aria-label={`Example: ${section.title}`}
                >
                  {section.examples.join('\n\n')}
                </pre>
              )}
            </div>
          </details>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-base font-medium text-content-primary">External resources</h2>
        <div className="flex flex-col gap-8">
          {RESOURCE_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-content-tertiary">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <li
                    key={item.url}
                    className="rounded-lg border border-border-tertiary bg-background-secondary px-4 py-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-accent underline-offset-2 hover:underline"
                      >
                        {item.label}
                      </a>
                      <span className="text-xs text-content-tertiary">{item.tag}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
