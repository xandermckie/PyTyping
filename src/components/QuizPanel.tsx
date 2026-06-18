import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import CodePeekPanel from './CodePeekPanel';
import StaticCode from './StaticCode';
import type { QuizQuestion, QuizScore } from '../types/exercise';

interface QuizPanelProps {
  exerciseId: string;
  code: string;
  questions: QuizQuestion[];
  onComplete: (score: QuizScore) => void;
}

export default function QuizPanel({ exerciseId, code, questions, onComplete }: QuizPanelProps) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [index, setIndex] = useState(0);
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
      if (selections[index] !== null) return;
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

  useEffect(() => {
    if (!answered) optionRefs.current[focusedOption]?.focus();
  }, [focusedOption, answered, index]);

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
      <CodePeekPanel open={codeOpen} onToggle={() => setCodeOpen((o) => !o)}>
        <StaticCode code={code} />
      </CodePeekPanel>

      {/* Progress header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-content-tertiary">
          Question {index + 1} of {questions.length}
        </span>
        <span className="text-xs text-content-tertiary">{exerciseId}</span>
      </div>
      <div className="mb-8 h-[2px] w-full overflow-hidden rounded-full bg-background-tertiary">
        <div
          className="h-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question */}
      <h2 className="mb-7 text-lg font-semibold leading-snug text-content-primary">
        {question.question}
      </h2>

      {/* Options */}
      <div role="radiogroup" aria-label="Answer options" onKeyDown={onKeyDown} className="flex flex-col gap-2.5">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isChosen = selected === i;

          let cls = 'border-border-tertiary hover:border-border-secondary hover:bg-background-secondary';
          if (answered) {
            if (isCorrect)
              cls = 'border-success/50 bg-success/8 text-success';
            else if (isChosen)
              cls = 'border-error/50 bg-error/8 text-error';
            else
              cls = 'border-border-tertiary opacity-50';
          }

          return (
            <button
              key={i}
              ref={(el) => { optionRefs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={answered}
              tabIndex={!answered && i === focusedOption ? 0 : -1}
              onClick={() => select(i)}
              className={`group flex items-center justify-between rounded-lg border px-4 py-3.5 text-left text-sm text-content-primary transition-all duration-100 disabled:cursor-default ${cls}`}
            >
              <span className="font-mono leading-relaxed">{option}</span>
              {answered && isCorrect && (
                <span className="ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              {answered && isChosen && !isCorrect && (
                <span className="ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-error/15 text-error">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M3 3L7 7M7 3L3 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation + advance */}
      <div aria-live="polite" className="mt-6">
        {answered && (
          <>
            <p className="rounded-lg border border-border-tertiary bg-background-secondary px-4 py-3.5 text-sm leading-relaxed text-content-secondary italic">
              {question.explanation}
            </p>
            <div className="mt-5 flex items-center gap-4">
              <button
                ref={advanceRef}
                type="button"
                onClick={advance}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {isLast ? 'See results →' : 'Next question →'}
              </button>
              <span className="text-xs text-content-tertiary">
                {correctCount} / {index + 1} correct so far
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
