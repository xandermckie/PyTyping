import type { ReactNode } from 'react';
import StaticCode from './StaticCode';
import type { Exercise } from '../types/exercise';

interface BreakdownPanelProps {
  exercise: Exercise;
  /** Resolved related exercises (already looked up from IDs by the parent). */
  related: Exercise[];
  onSelectExercise: (id: string) => void;
  onNext: () => void;
  recommendedExerciseId?: string | null;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border-tertiary pt-6">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-content-secondary">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Post-quiz learning panel. Vertical stack of sections — overview, key terms,
 * how it works, optional design pattern, a code recap, and related exercises.
 * Explains WHY, not just WHAT (see the brief's tone guidance).
 */
export default function BreakdownPanel({
  exercise,
  related,
  onSelectExercise,
  onNext,
  recommendedExerciseId,
}: BreakdownPanelProps) {
  const { explanation } = exercise;

  return (
    <div className="mx-auto w-full max-w-2xl pb-12">
      <header className="mb-6">
        <p className="text-sm text-content-secondary">What you just learned</p>
        <h1 className="mt-1 text-lg font-medium text-content-primary">{exercise.title}</h1>
      </header>

      <div className="flex flex-col gap-8">
        <section>
          <p className="leading-relaxed text-content-primary">{explanation.overview}</p>
        </section>

        {explanation.keyTerms.length > 0 && (
          <Section title="Key terms">
            <dl className="flex flex-col gap-4">
              {explanation.keyTerms.map((kt) => (
                <div key={kt.term}>
                  <dt className="font-mono text-sm font-medium text-accent">{kt.term}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-content-secondary">{kt.definition}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        <Section title="How it works">
          {/* Preserve authored line breaks in the walk-through. */}
          <p className="whitespace-pre-line text-sm leading-relaxed text-content-primary">
            {explanation.howItWorks}
          </p>
        </Section>

        <Section title="The code">
          <StaticCode code={exercise.code} />
        </Section>

        {explanation.designPattern && (
          <Section title="Design pattern">
            <p className="text-sm leading-relaxed text-content-primary">{explanation.designPattern}</p>
          </Section>
        )}

        {related.length > 0 && (
          <Section title="Related exercises">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => onSelectExercise(ex.id)}
                  className="rounded-md border border-border-tertiary px-4 py-3 text-left transition-colors hover:bg-background-secondary"
                >
                  <span className="block text-sm font-medium text-content-primary">{ex.title}</span>
                  <span className="mt-1 block text-xs text-content-tertiary">
                    {ex.difficulty} · {ex.topics.join(', ')}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="mt-10 flex justify-end">
        <div className="flex gap-2">
          {recommendedExerciseId && (
            <button
              type="button"
              onClick={() => onSelectExercise(recommendedExerciseId)}
              className="rounded-md border border-border-tertiary px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-background-secondary"
            >
              Recommended next
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="rounded-md border border-accent px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background-secondary"
          >
            Next exercise →
          </button>
        </div>
      </div>
    </div>
  );
}
