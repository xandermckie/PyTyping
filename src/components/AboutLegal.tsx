import type { ReactNode } from 'react';
import Logo from './Logo';
import {
  APP_VERSION,
  AUTHOR_NAME,
  GITHUB_BUG_REPORT_URL,
  GITHUB_URL,
  MONKEYTYPE_URL,
  PYTHON_DOCS_URL,
  REAL_PYTHON_URL,
} from '../lib/links';

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border-tertiary pt-5">
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-content-secondary">{title}</h2>
      <div className="text-sm leading-relaxed text-content-secondary">{children}</div>
    </section>
  );
}

/** About + all legal notices: credits, license, attributions, privacy, marks. */
export default function AboutLegal() {
  return (
    <div className="mx-auto w-full max-w-2xl pb-12">
      <div className="mb-8 flex items-center gap-3">
        <Logo size={32} wordmark={false} className="text-content-primary" />
        <div>
          <h1 className="text-lg font-medium text-content-primary">About PyTyping</h1>
          <p className="text-xs text-content-tertiary">Version {APP_VERSION}</p>
        </div>
      </div>

      <p className="mb-8 text-sm leading-relaxed text-content-primary">
        PyTyping is a minimalist game for learning Python by typing real code, with instant feedback,
        short quizzes, and plain-language breakdowns. Created by{' '}
        <ExtLink href={GITHUB_URL}>{AUTHOR_NAME}</ExtLink>.
      </p>

      <div className="flex flex-col gap-6">
        <Section title="Credits & inspiration">
          PyTyping&apos;s interface is inspired by <ExtLink href={MONKEYTYPE_URL}>Monkeytype</ExtLink>, the
          excellent open-source typing test. PyTyping is an independent project and is not affiliated
          with, endorsed by, or sponsored by Monkeytype.
        </Section>

        <Section title="License">
          © {new Date().getFullYear()} {AUTHOR_NAME}. PyTyping is released under the MIT License — you
          may use, copy, modify, and distribute it with attribution and without warranty. The full
          text ships in the project&apos;s <span className="font-mono">LICENSE</span> file.
        </Section>

        <Section title="Exercise attribution">
          Curated exercises are adapted from the official{' '}
          <ExtLink href={PYTHON_DOCS_URL}>Python documentation</ExtLink> and{' '}
          <ExtLink href={REAL_PYTHON_URL}>Real Python</ExtLink>, used for educational purposes; all
          other exercises are generated originals. Python documentation is © the Python Software
          Foundation, made available under the PSF License.
        </Section>

        <Section title="Trademarks">
          &quot;Python&quot; and the Python logos are trademarks of the Python Software Foundation.
          PyTyping is not affiliated with or endorsed by the PSF.
        </Section>

        <Section title="Privacy">
          PyTyping runs entirely in your browser. There is no server, no cookies, and no analytics or
          tracking of any kind. Guest progress is stored only for the current browser session
          (sessionStorage). When you create an account, your data and settings are stored locally on
          your device (localStorage); passwords are salted and hashed (PBKDF2-SHA-256), never stored
          in plain text. If Web Crypto is unavailable, a weaker hash fallback is used — see Settings
          for export options. Use Export backup in Settings to move your data between devices.
          <p className="mt-3">
            If you choose a non-system font in Settings, your browser may download font files from{' '}
            <ExtLink href="https://fonts.google.com">Google Fonts</ExtLink> (fonts.googleapis.com /
            fonts.gstatic.com). That request may send your IP address to Google. System and bundled
            fallback fonts work without any network request.
          </p>
          <p className="mt-3">
            Links to open a GitHub issue (for example, to request a new language) take you to{' '}
            <ExtLink href="https://github.com">GitHub</ExtLink>, a third-party service governed by
            GitHub&apos;s terms and privacy policy.
          </p>
          <p className="mt-3">
            Ghost race replays are stored locally on your device. Exporting a ghost file includes your
            display name, exercise id, typing speed, accuracy, and cursor timing — not the full
            exercise source code. Importing a friend&apos;s ghost is a user-initiated file upload;
            PyTyping does not fetch ghosts from the network.
          </p>
          <p className="mt-3">
            Friend codes are compressed pasteable strings you share manually (chat, email, etc.). They may
            include an optional profile photo thumbnail and replay timing data. Profile photos for local
            accounts are stored only on your device and in backup exports — never uploaded to a server.
          </p>
          <p className="mt-3">
            Backups (Settings → Export) include ghost replays, friend imports, profile photos, and race rank
            stats alongside progress and accounts.
          </p>
        </Section>

        <Section title="Accessibility">
          PyTyping aims to meet WCAG 2.1 Level AA. The typing caret and challenge-mode character
          hiding are primarily visual; screen-reader users can use Guided mode for full code visibility.
          If you encounter a barrier, please{' '}
          <ExtLink href={GITHUB_BUG_REPORT_URL}>report it on GitHub</ExtLink> and mention
          &quot;accessibility&quot; in the issue.
        </Section>

        <Section title="Disclaimer">
          PyTyping is provided “as is”, for educational use, without warranty of any kind. Code
          snippets are simplified for learning and may omit error handling appropriate for
          production use.
        </Section>
      </div>
    </div>
  );
}
