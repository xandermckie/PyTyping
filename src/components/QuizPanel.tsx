import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { QuizQuestion, QuizScore } from '../types/exercise';

interface QuizPanelProps {
  exerciseId: string;
  questions: QuizQuestion[];
  /** Fired after the final question, with the user's score. */
  onComplete: (score: QuizScore) => void;
}

/**
 * Post-exercise knowledge check. One question at a time. Selecting an option
 * immediately locks the question and reveals correctness + explanation; the
 * correct answer is highlighted green, a wrong pick red. Fully keyboard driven:
 * arrow keys move between options (roving tabindex), Enter/Space selects, and
 * Enter again advances.
 */
export default function QuizPanel({ exerciseId, questions, onComplete }: QuizPanelProps) {
  const [index, setIndex] = useState(0);
  // One slot per question: the chosen option index, or null if unanswered.
  const [selections, setSelections] = useState<Array<number | null>>(() =>
    questions.map(() => null),
  );
  const [focusedOption, setFocusedOption] = useState(0);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const advanceRef = useRef<HTMLButtonElement>(null);

  const question = questions[index];
  const selected = selections[index];
  const answered = selected !== null;
  const isLast = index === questions.length - 1;

  const correctCount = useMemo(
    () => selections.reduce<number>((n, sel, i) => (sel === questions[i].correctIndex ? n + 1 : n), 0),
    [selections, questions],
  );

  const select = useCallback(
    (optionIndex: number) => {
      if (selections[index] !== null) return; // locked after first answer
      setSelections((prev) => {
        const next = [...prev];
        next[index] = optionIndex;
        return next;
      });
    },
    [index, selections],
  );

  const advance = useCallback(() => {
    if (isLast) {
      onComplete({ correct: correctCount, total: questions.length });
      return;
    }
    setIndex((i) => i + 1);
    setFocusedOption(0);
  }, [correctCount, isLast, onComplete, questions.length]);

  // Move DOM focus to whichever option is "roving-focused".
  useEffect(() => {
    if (!answered) optionRefs.current[focusedOption]?.focus();
  }, [focusedOption, answered, index]);

  // Once answered, surface the advance button to the keyboard.
  useEffect(() => {
    if (answered) advanceRef.current?.focus();
  }, [answered]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const last = question.options.length - 1;
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          if (!answered) setFocusedOption((f) => Math.min(last, f + 1));
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          if (!answered) setFocusedOption((f) => Math.max(0, f - 1));
          break;
        case 'Home':
          e.preventDefault();
          if (!answered) setFocusedOption(0);
          break;
        case 'End':
          e.preventDefault();
          if (!answered) setFocusedOption(last);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (answered) advance();
          else select(focusedOption);
          break;
        default:
          break;
      }
    },
    [answered, advance, focusedOption, question.options.length, select],
  );

  const progressPct = ((index + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress */}
      <div className="mb-2 flex items-center justify-between text-sm text-content-secondary">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>{exerciseId}</span>
      </div>
      <div className="mb-8 h-[3px] w-full overflow-hidden rounded-md bg-background-tertiary">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${progressPct}%` }} />
      </div>

      <h2 className="mb-6 text-lg font-medium leading-snug text-content-primary">
        {question.question}
      </h2>

      <div role="radiogroup" aria-label="Answer options" onKeyDown={onKeyDown} className="flex flex-col gap-3">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isChosen = selected === i;

          // Visual state only appears after the question is answered.
          let cls = 'border-border-tertiary hover:bg-background-secondary';
          if (answered) {
            if (isCorrect) cls = 'border-success bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)]';
            else if (isChosen) cls = 'border-error bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]';
            else cls = 'border-border-tertiary opacity-60';
          }

          return (
            <button
              key={i}
              ref={(el) => {
                optionRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={answered}
              tabIndex={!answered && i === focusedOption ? 0 : -1}
              onClick={() => select(i)}
              className={`flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm text-content-primary transition-colors disabled:cursor-default ${cls}`}
            >
              <span className="font-mono">{option}</span>
              {answered && isCorrect && <span className="ml-3 text-success">✓</span>}
              {answered && isChosen && !isCorrect && <span className="ml-3 text-error">✗</span>}
            </button>
          );
        })}
      </div>

      {/* Explanation + advance, revealed after answering. */}
      <div aria-live="polite" className="mt-6">
        {answered && (
          <>
            <p className="text-sm italic text-content-secondary">{question.explanation}</p>
            <div className="mt-6 flex items-center gap-4">
              <button
                ref={advanceRef}
                type="button"
                onClick={advance}
                className="rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-background-secondary"
              >
                {isLast ? 'See results →' : 'Next question →'}
              </button>
              <span className="text-sm text-content-tertiary">
                {correctCount} correct so far
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
