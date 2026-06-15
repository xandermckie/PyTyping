/**
 * Exercise bank generator.
 *
 * Hand-authoring 500 quality exercises is infeasible, so we GENERATE them from
 * a set of operation templates. The key invariant: every snippet is real,
 * runnable Python and every quiz answer is computed here with Python-accurate
 * semantics (we deliberately restrict inputs to positive ints / simple ASCII to
 * avoid edge cases where JS and Python disagree — e.g. negative %, banker's
 * rounding). Output is written to src/data/exercises.json = curated + generated.
 *
 * Run: npm run gen:exercises
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = 'https://docs.python.org/3/';

/* ----------------------------- value formatting --------------------------- */

function pyRepr(v) {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return '[' + v.map(pyRepr).join(', ') + ']';
  if (typeof v === 'object') {
    if ('float' in v) return Number.isInteger(v.float) ? v.float.toFixed(1) : String(v.float);
    if ('tuple' in v) return '(' + v.tuple.map(pyRepr).join(', ') + ')';
  }
  return String(v);
}
/** stdout of print(value): top-level strings print unquoted. */
function pyStr(v) {
  return typeof v === 'string' ? v : pyRepr(v);
}

/* ------------------------------ deterministic RNG ------------------------- */

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `n` distinct distractors (≠ correct), padding from extras if short. */
function pickDistractors(correct, pool, n, extras = []) {
  const out = [];
  const seen = new Set([correct]);
  for (const c of [...pool, ...extras]) {
    if (out.length >= n) break;
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

/* --------------------------------- data ----------------------------------- */

const WORDS = [
  'python', 'function', 'variable', 'iterator', 'keyword', 'module', 'decorator',
  'boolean', 'integer', 'compiler', 'runtime', 'developer', 'algorithm', 'exception',
  'generator', 'recursion', 'namespace', 'attribute', 'framework', 'syntax',
  'closure', 'lambda', 'mutable', 'sequence', 'protocol',
];
const PHRASES = [
  'hello world', 'open source', 'clean code', 'unit test', 'data model',
  'list comprehension', 'pure function', 'error handling', 'type hint', 'edge case',
];
const INT_LISTS = [
  [3, 1, 4, 1, 5], [10, 20, 30], [7, 2, 9], [5, 5, 8, 1], [2, 4, 6, 8],
  [9, 3, 7, 1], [1, 2, 3, 4, 5], [8, 6, 4, 2], [12, 5, 9], [4, 4, 4, 1],
  [6, 2, 8], [1, 9, 5, 3], [4, 7, 2, 9, 1], [10, 5, 15], [3, 3, 6],
  [8, 1, 4, 7], [2, 11, 5], [9, 9, 2], [7, 4, 4, 1], [5, 8, 3, 6],
  [12, 4, 8], [1, 1, 1, 9], [6, 6, 2, 2], [10, 3, 7, 1], [2, 5, 8, 11],
];
const DICTS = [
  { code: '{"a": 1, "b": 2, "c": 3}', obj: { a: 1, b: 2, c: 3 } },
  { code: '{"x": 10, "y": 20}', obj: { x: 10, y: 20 } },
  { code: '{"red": 1, "green": 2, "blue": 3}', obj: { red: 1, green: 2, blue: 3 } },
  { code: '{"one": 1, "two": 2}', obj: { one: 1, two: 2 } },
  { code: '{"name": 5, "age": 9}', obj: { name: 5, age: 9 } },
  { code: '{"p": 7, "q": 8, "r": 9}', obj: { p: 7, q: 8, r: 9 } },
  { code: '{"first": 1, "second": 2, "third": 3, "fourth": 4}', obj: { first: 1, second: 2, third: 3, fourth: 4 } },
  { code: '{"cat": 3, "dog": 4}', obj: { cat: 3, dog: 4 } },
];

/* ----------------------------- concept questions -------------------------- */

const CONCEPTS = {
  strings: [
    {
      question: 'Are Python strings mutable?',
      options: ['No — string methods return a new string', 'Yes — they can be edited in place'],
      correctIndex: 0,
      explanation: 'Strings are immutable; methods like .upper() return a brand-new string and leave the original unchanged.',
    },
    {
      question: 'What does indexing a string like text[0] return?',
      options: ['A one-character string', 'A list of characters', 'The character code', 'A tuple'],
      correctIndex: 0,
      explanation: 'Indexing returns a length-1 string in Python (there is no separate char type).',
    },
  ],
  lists: [
    {
      question: 'Lists in Python are…',
      options: ['ordered and mutable', 'unordered', 'immutable', 'fixed-size'],
      correctIndex: 0,
      explanation: 'Lists keep insertion order and can be changed in place.',
    },
    {
      question: 'What does sorted() do to the original list?',
      options: ['Leaves it unchanged and returns a new sorted list', 'Sorts it in place and returns None'],
      correctIndex: 0,
      explanation: 'sorted() returns a new list; list.sort() is the in-place version.',
    },
  ],
  math: [
    {
      question: 'What does the // operator do?',
      options: ['Floor division (discards the fractional part)', 'Float division', 'Exponentiation', 'Modulo'],
      correctIndex: 0,
      explanation: '// divides and rounds down to the nearest whole number.',
    },
    {
      question: 'What does the % operator return?',
      options: ['The remainder of division', 'The quotient', 'A percentage', 'The floor'],
      correctIndex: 0,
      explanation: '% yields the remainder; ** is power and // is floor division.',
    },
  ],
  dicts: [
    {
      question: 'What does dict.get("k") return if "k" is missing?',
      options: ['None (or the default you pass)', 'It raises KeyError', '0', 'An empty string'],
      correctIndex: 0,
      explanation: 'Unlike d["k"], .get() returns None (or a supplied default) instead of raising.',
    },
    {
      question: 'What does "key" in some_dict check?',
      options: ['Whether the key exists', 'Whether the value exists', 'The number of keys', 'Nothing useful'],
      correctIndex: 0,
      explanation: 'The in operator on a dict tests membership among its keys.',
    },
  ],
  loops: [
    {
      question: 'What does range(a, b) include?',
      options: ['a up to but not including b', 'a and b inclusive', 'b down to a', 'only b'],
      correctIndex: 0,
      explanation: 'range is inclusive of the start and exclusive of the stop.',
    },
    {
      question: 'Is range() evaluated lazily?',
      options: ['Yes — it produces values on demand', 'No — it builds a full list immediately'],
      correctIndex: 0,
      explanation: 'range is a lazy sequence; wrap it in list() to materialize it.',
    },
  ],
  fstrings: [
    {
      question: 'What goes inside the {} of an f-string?',
      options: ['Any Python expression', 'Only variable names', 'Only strings', 'Only numbers'],
      correctIndex: 0,
      explanation: 'f-strings evaluate arbitrary expressions inside the braces at runtime.',
    },
    {
      question: 'What does the :.2f format spec do?',
      options: ['Formats a number with 2 decimal places', 'Rounds to 2 significant figures', 'Pads with 2 spaces', 'Adds 2 to the value'],
      correctIndex: 0,
      explanation: '.2f fixes the output to two digits after the decimal point.',
    },
  ],
  types: [
    {
      question: 'What does type(x) tell you?',
      options: ["The object's class", 'Its value', 'Its length', 'Its memory address'],
      correctIndex: 0,
      explanation: 'type() returns the class of the object; .__name__ gives that class name as a string.',
    },
    {
      question: 'What is the type of a value like True?',
      options: ['bool', 'int', 'str', 'None'],
      correctIndex: 0,
      explanation: 'True and False are of type bool (a subclass of int).',
    },
  ],
  booleans: [
    {
      question: 'Which values are "falsy" in Python?',
      options: ['0, "", [], {}, None', 'only False', 'only None', 'negative numbers'],
      correctIndex: 0,
      explanation: 'Empty containers, 0, empty string, and None all evaluate to False in a boolean context.',
    },
    {
      question: 'What does bool(x) do?',
      options: ['Returns the truthiness of x as True/False', 'Always returns True', 'Converts x to an integer'],
      correctIndex: 0,
      explanation: 'bool() applies Python truthiness rules and returns True or False.',
    },
  ],
};

/* ------------------------------- builder ---------------------------------- */

const rand = makeRng(20260615);
let seq = 0;

function outputQuestion(correct, distractorPool, extras = []) {
  const distractors = pickDistractors(correct, distractorPool, 3, extras);
  const options = shuffle([correct, ...distractors], rand);
  return {
    question: 'What does this code print?',
    options,
    correctIndex: options.indexOf(correct),
    explanation: `It prints ${correct === '' ? '(an empty line)' : '`' + correct + '`'}.`,
  };
}

/**
 * Assemble one exercise. `spec` provides code, the printed output, distractors,
 * topic/difficulty/title, the concept group, key terms, and how-it-works text.
 */
function make(spec) {
  seq += 1;
  const id = `gen-${spec.cat}-${String(seq).padStart(3, '0')}`;
  const concepts = CONCEPTS[spec.concept] ?? [];
  return {
    id,
    title: spec.title,
    description: spec.description,
    difficulty: spec.difficulty ?? 'beginner',
    topics: spec.topics,
    sourceUrl: spec.sourceUrl ?? DOCS,
    sourceLabel: 'Practice',
    estimatedTime: 1,
    code: spec.code,
    explanation: {
      overview: spec.overview,
      keyTerms: spec.keyTerms ?? [],
      howItWorks: spec.howItWorks,
      relatedExercises: [],
      ...(spec.designPattern ? { designPattern: spec.designPattern } : {}),
    },
    quiz: [outputQuestion(spec.output, spec.distractors, spec.extras), ...concepts],
  };
}

const cap = (list, n) => list.slice(0, n);

/* ============================== TEMPLATES ================================= */

const builders = [];

// --- String case methods -------------------------------------------------
builders.push(() => {
  const out = [];
  const mixed = (w) => w.split('').map((c, i) => (i % 2 ? c.toUpperCase() : c)).join('');
  for (const w of WORDS) {
    const W = w.toUpperCase();
    out.push(make({
      cat: 'str-upper', concept: 'strings', topics: ['strings', 'methods'],
      title: 'String method: upper()',
      description: `Uppercase the string "${w}".`,
      code: `text = "${w}"\nprint(text.upper())`,
      output: W,
      distractors: [w, w[0].toUpperCase() + w.slice(1), w.split('').reverse().join('').toUpperCase()],
      overview: 'str.upper() returns a new string with every character converted to uppercase. The original string is never modified, because strings are immutable.',
      keyTerms: [
        { term: 'str.upper()', definition: 'Returns a copy of the string with all cased characters uppercased.' },
        { term: 'immutability', definition: 'Strings cannot be changed in place; methods return new strings.' },
      ],
      howItWorks: `1. text holds "${w}".\n2. text.upper() builds a new string, "${W}".\n3. print() writes that to stdout; text itself is unchanged.`,
    }));
    out.push(make({
      cat: 'str-lower', concept: 'strings', topics: ['strings', 'methods'],
      title: 'String method: lower()',
      description: `Lowercase the string "${W}".`,
      code: `text = "${W}"\nprint(text.lower())`,
      output: w,
      distractors: [W, w[0].toUpperCase() + w.slice(1), W.split('').reverse().join('')],
      overview: 'str.lower() returns a new string with every character converted to lowercase.',
      keyTerms: [{ term: 'str.lower()', definition: 'Returns a lowercased copy of the string.' }],
      howItWorks: `1. text holds "${W}".\n2. text.lower() returns "${w}".\n3. The original is untouched.`,
    }));
    out.push(make({
      cat: 'str-cap', concept: 'strings', topics: ['strings', 'methods'],
      title: 'String method: capitalize()',
      description: `Capitalize "${w}".`,
      code: `text = "${w}"\nprint(text.capitalize())`,
      output: w[0].toUpperCase() + w.slice(1),
      distractors: [w.toUpperCase(), w, w.split('').reverse().join('')],
      overview: 'str.capitalize() uppercases the first character and lowercases the rest.',
      keyTerms: [{ term: 'str.capitalize()', definition: 'First character uppercased, remaining characters lowercased.' }],
      howItWorks: `1. The first letter of "${w}" becomes "${w[0].toUpperCase()}".\n2. The rest stays lowercase.\n3. Result: "${w[0].toUpperCase() + w.slice(1)}".`,
    }));
    out.push(make({
      cat: 'str-swap', concept: 'strings', topics: ['strings', 'methods'],
      title: 'String method: swapcase()',
      description: 'Swap the case of every letter.',
      code: `text = "${mixed(w)}"\nprint(text.swapcase())`,
      output: mixed(w).split('').map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join(''),
      distractors: [mixed(w), w.toUpperCase(), w],
      overview: 'str.swapcase() flips lowercase to uppercase and vice versa.',
      keyTerms: [{ term: 'str.swapcase()', definition: 'Returns a copy with the case of each letter inverted.' }],
      howItWorks: `Each letter in "${mixed(w)}" has its case flipped to produce the result.`,
    }));
  }
  for (const p of PHRASES) {
    const title = p.split(' ').map((x) => x[0].toUpperCase() + x.slice(1)).join(' ');
    out.push(make({
      cat: 'str-title', concept: 'strings', topics: ['strings', 'methods'],
      title: 'String method: title()',
      description: `Title-case "${p}".`,
      code: `text = "${p}"\nprint(text.title())`,
      output: title,
      distractors: [p, p.toUpperCase(), p[0].toUpperCase() + p.slice(1)],
      overview: 'str.title() uppercases the first letter of each word and lowercases the rest.',
      keyTerms: [{ term: 'str.title()', definition: 'Capitalizes the start of every word in the string.' }],
      howItWorks: `Each word in "${p}" gets its first letter capitalized → "${title}".`,
    }));
  }
  return out;
});

// --- String misc ----------------------------------------------------------
builders.push(() => {
  const out = [];
  for (const w of WORDS) {
    out.push(make({
      cat: 'str-len', concept: 'strings', topics: ['strings', 'built-ins'],
      title: 'Built-in: len() of a string',
      description: `How long is "${w}"?`,
      code: `text = "${w}"\nprint(len(text))`,
      output: String(w.length),
      distractors: [String(w.length - 1), String(w.length + 1), String(w.length * 2)],
      overview: 'len() returns the number of characters in a string.',
      keyTerms: [{ term: 'len()', definition: 'Returns the number of items (here, characters) in a sequence.' }],
      howItWorks: `"${w}" has ${w.length} characters, so len(text) is ${w.length}.`,
    }));
    out.push(make({
      cat: 'str-index', concept: 'strings', topics: ['strings', 'indexing'],
      title: 'String indexing',
      description: 'Read a single character by index.',
      code: `text = "${w}"\nprint(text[0])`,
      output: w[0],
      distractors: [w[1], w[w.length - 1], w],
      overview: 'Indexing with [0] returns the first character. Python indexes are zero-based.',
      keyTerms: [{ term: 'zero-based indexing', definition: 'The first element is at index 0.' }],
      howItWorks: `text[0] is the first character of "${w}", which is "${w[0]}".`,
    }));
    out.push(make({
      cat: 'str-rev', concept: 'strings', topics: ['strings', 'slicing'],
      title: 'Reverse a string with slicing',
      description: 'Use [::-1] to reverse.',
      code: `text = "${w}"\nprint(text[::-1])`,
      output: w.split('').reverse().join(''),
      distractors: [w, w.toUpperCase(), w.slice(1) + w[0]],
      difficulty: 'intermediate',
      overview: 'The slice [::-1] walks the string with a step of -1, producing it reversed.',
      keyTerms: [{ term: 'slice step', definition: 'The third slice value sets the stride; -1 means right-to-left.' }],
      howItWorks: `Stepping through "${w}" backwards yields "${w.split('').reverse().join('')}".`,
    }));
    const a = 1;
    const b = Math.min(4, w.length);
    out.push(make({
      cat: 'str-slice', concept: 'strings', topics: ['strings', 'slicing'],
      title: 'String slicing',
      description: `Slice characters ${a}..${b}.`,
      code: `text = "${w}"\nprint(text[${a}:${b}])`,
      output: w.slice(a, b),
      distractors: [w.slice(0, b), w.slice(a, b + 1), w.slice(a)],
      overview: 'A slice [a:b] returns characters from index a up to but not including b.',
      keyTerms: [{ term: 'half-open slice', definition: 'The start is included, the stop is excluded.' }],
      howItWorks: `text[${a}:${b}] takes indices ${a} through ${b - 1} → "${w.slice(a, b)}".`,
    }));
  }
  for (const p of PHRASES) {
    out.push(make({
      cat: 'str-split', concept: 'strings', topics: ['strings', 'methods'],
      title: 'String method: split()',
      description: 'Split a sentence into words.',
      code: `text = "${p}"\nprint(text.split())`,
      output: pyStr(p.split(' ')),
      distractors: [pyStr([p]), pyStr(p.split('')), p],
      overview: 'str.split() with no argument splits on whitespace and returns a list of words.',
      keyTerms: [{ term: 'str.split()', definition: 'Breaks a string into a list of substrings on a separator (default: whitespace).' }],
      howItWorks: `"${p}" splits on the space into ${pyStr(p.split(' '))}.`,
    }));
  }
  return out;
});

// --- Lists ---------------------------------------------------------------
builders.push(() => {
  const out = [];
  const asc = (l) => [...l].sort((x, y) => x - y);
  for (const L of INT_LISTS) {
    const lit = pyStr(L);
    out.push(make({
      cat: 'list-sum', concept: 'lists', topics: ['lists', 'built-ins'],
      title: 'Built-in: sum() of a list',
      description: 'Add up the numbers.',
      code: `numbers = ${lit}\nprint(sum(numbers))`,
      output: String(L.reduce((a, b) => a + b, 0)),
      distractors: [String(L.reduce((a, b) => a + b, 0) + 1), String(Math.max(...L)), String(L.length)],
      overview: 'sum() adds every number in an iterable and returns the total.',
      keyTerms: [{ term: 'sum()', definition: 'Returns the sum of the items in an iterable.' }],
      howItWorks: `Adding ${L.join(' + ')} gives ${L.reduce((a, b) => a + b, 0)}.`,
    }));
    out.push(make({
      cat: 'list-max', concept: 'lists', topics: ['lists', 'built-ins'],
      title: 'Built-in: max() of a list',
      description: 'Find the largest value.',
      code: `numbers = ${lit}\nprint(max(numbers))`,
      output: String(Math.max(...L)),
      distractors: [String(Math.min(...L)), String(L.length), String(L[0])],
      overview: 'max() returns the largest item in an iterable.',
      keyTerms: [{ term: 'max()', definition: 'Returns the largest element.' }],
      howItWorks: `The largest of ${lit} is ${Math.max(...L)}.`,
    }));
    out.push(make({
      cat: 'list-len', concept: 'lists', topics: ['lists', 'built-ins'],
      title: 'Built-in: len() of a list',
      description: 'Count the items.',
      code: `numbers = ${lit}\nprint(len(numbers))`,
      output: String(L.length),
      distractors: [String(L.length - 1), String(L.length + 1), String(Math.max(...L))],
      overview: 'len() returns how many items a list contains.',
      keyTerms: [{ term: 'len()', definition: 'Number of items in a container.' }],
      howItWorks: `${lit} has ${L.length} items.`,
    }));
    out.push(make({
      cat: 'list-sorted', concept: 'lists', topics: ['lists', 'sorting'],
      title: 'Built-in: sorted()',
      description: 'Sort ascending.',
      code: `numbers = ${lit}\nprint(sorted(numbers))`,
      output: pyStr(asc(L)),
      distractors: [pyStr([...asc(L)].reverse()), lit, pyStr([...L].reverse())],
      overview: 'sorted() returns a new list ordered ascending; the original is untouched.',
      keyTerms: [{ term: 'sorted()', definition: 'Returns a new sorted list from any iterable.' }],
      howItWorks: `Ordering ${lit} ascending gives ${pyStr(asc(L))}.`,
    }));
    out.push(make({
      cat: 'list-rev-sort', concept: 'lists', topics: ['lists', 'sorting'],
      title: 'sorted(reverse=True)',
      description: 'Sort descending.',
      code: `numbers = ${lit}\nprint(sorted(numbers, reverse=True))`,
      output: pyStr([...asc(L)].reverse()),
      distractors: [pyStr(asc(L)), lit, pyStr([...L].reverse())],
      difficulty: 'intermediate',
      overview: 'The reverse=True keyword sorts from largest to smallest.',
      keyTerms: [{ term: 'keyword argument', definition: 'A named argument like reverse=True passed to a function.' }],
      howItWorks: `Descending order of ${lit} is ${pyStr([...asc(L)].reverse())}.`,
    }));
    out.push(make({
      cat: 'list-comp', concept: 'lists', topics: ['lists', 'comprehensions'],
      title: 'List comprehension: doubling',
      description: 'Double every number.',
      code: `numbers = ${lit}\nprint([n * 2 for n in numbers])`,
      output: pyStr(L.map((n) => n * 2)),
      distractors: [lit, pyStr(L.map((n) => n + 2)), pyStr(L.map((n) => n * n))],
      difficulty: 'intermediate',
      overview: 'A list comprehension builds a new list by applying an expression to each item.',
      keyTerms: [{ term: 'list comprehension', definition: '[expr for item in iterable] constructs a list in one expression.' }],
      howItWorks: `Each n in ${lit} becomes n*2 → ${pyStr(L.map((n) => n * 2))}.`,
    }));
    out.push(make({
      cat: 'list-filter', concept: 'lists', topics: ['lists', 'comprehensions'],
      title: 'List comprehension: filter evens',
      description: 'Keep only even numbers.',
      code: `numbers = ${lit}\nprint([n for n in numbers if n % 2 == 0])`,
      output: pyStr(L.filter((n) => n % 2 === 0)),
      distractors: [pyStr(L.filter((n) => n % 2 === 1)), lit, pyStr(L.map((n) => n * 2))],
      difficulty: 'intermediate',
      overview: 'An if clause in a comprehension filters which items are kept.',
      keyTerms: [{ term: 'comprehension filter', definition: 'The trailing if keeps only items matching a condition.' }],
      howItWorks: `Keeping the even values of ${lit} → ${pyStr(L.filter((n) => n % 2 === 0))}.`,
    }));
    out.push(make({
      cat: 'list-index', concept: 'lists', topics: ['lists', 'indexing'],
      title: 'List indexing',
      description: 'Read the first element.',
      code: `numbers = ${lit}\nprint(numbers[0])`,
      output: String(L[0]),
      distractors: [String(L[1]), String(L[L.length - 1]), String(L.length)],
      overview: 'numbers[0] reads the first element (indexing is zero-based).',
      keyTerms: [{ term: 'indexing', definition: 'Access an element by its position, starting at 0.' }],
      howItWorks: `The element at index 0 of ${lit} is ${L[0]}.`,
    }));
  }
  return out;
});

// --- Arithmetic ----------------------------------------------------------
builders.push(() => {
  const out = [];
  const pairs = [[12, 5], [20, 6], [9, 4], [15, 4], [7, 3], [18, 5], [10, 3], [21, 6], [14, 4], [8, 3], [25, 7], [11, 2]];
  for (const [a, b] of pairs) {
    out.push(make({
      cat: 'math-floordiv', concept: 'math', topics: ['math', 'operators'],
      title: 'Operator: // (floor division)',
      description: `Compute ${a} // ${b}.`,
      code: `print(${a} // ${b})`,
      output: String(Math.floor(a / b)),
      distractors: [String(a % b), String(Math.ceil(a / b)), String(Math.round(a / b))],
      overview: 'Floor division // divides and rounds down to the nearest whole number.',
      keyTerms: [{ term: '//', definition: 'Integer (floor) division: discards the fractional part.' }],
      howItWorks: `${a} / ${b} is ${(a / b).toFixed(2)}; floored that is ${Math.floor(a / b)}.`,
    }));
    out.push(make({
      cat: 'math-mod', concept: 'math', topics: ['math', 'operators'],
      title: 'Operator: % (modulo)',
      description: `Compute ${a} % ${b}.`,
      code: `print(${a} % ${b})`,
      output: String(a % b),
      distractors: [String(Math.floor(a / b)), String((a % b) + 1), String(b - (a % b))],
      overview: 'The modulo operator returns the remainder after division.',
      keyTerms: [{ term: '%', definition: 'Remainder of integer division.' }],
      howItWorks: `${a} = ${Math.floor(a / b)}×${b} + ${a % b}, so the remainder is ${a % b}.`,
    }));
    out.push(make({
      cat: 'math-divmod', concept: 'math', topics: ['math', 'built-ins'],
      title: 'Built-in: divmod()',
      description: `Compute divmod(${a}, ${b}).`,
      code: `print(divmod(${a}, ${b}))`,
      output: pyStr({ tuple: [Math.floor(a / b), a % b] }),
      distractors: [pyStr({ tuple: [a % b, Math.floor(a / b)] }), pyStr([Math.floor(a / b), a % b]), pyStr({ tuple: [Math.floor(a / b), 0] })],
      difficulty: 'intermediate',
      overview: 'divmod(a, b) returns a tuple of (a // b, a % b) — the quotient and remainder together.',
      keyTerms: [{ term: 'divmod()', definition: 'Returns (quotient, remainder) as a tuple.' }],
      howItWorks: `Quotient ${Math.floor(a / b)} and remainder ${a % b} → ${pyStr({ tuple: [Math.floor(a / b), a % b] })}.`,
    }));
    out.push(make({
      cat: 'math-cmp', concept: 'booleans', topics: ['math', 'booleans'],
      title: 'Comparison operator',
      description: `Is ${a} greater than ${b}?`,
      code: `print(${a} > ${b})`,
      output: pyStr(a > b),
      distractors: [pyStr(!(a > b))],
      overview: 'Comparison operators evaluate to a bool: True or False.',
      keyTerms: [{ term: 'comparison', definition: 'Operators like >, <, == yield booleans.' }],
      howItWorks: `${a} > ${b} is ${a > b ? 'True' : 'False'}.`,
    }));
    out.push(make({
      cat: 'math-add', concept: 'math', topics: ['math', 'operators'],
      title: 'Operator: + (addition)',
      description: `Compute ${a} + ${b}.`,
      code: `print(${a} + ${b})`,
      output: String(a + b),
      distractors: [String(a - b), String(a * b), String(a + b + 1)],
      overview: 'The + operator adds two numbers.',
      keyTerms: [{ term: '+', definition: 'Addition for numbers (concatenation for sequences).' }],
      howItWorks: `${a} + ${b} = ${a + b}.`,
    }));
    out.push(make({
      cat: 'math-sub', concept: 'math', topics: ['math', 'operators'],
      title: 'Operator: - (subtraction)',
      description: `Compute ${a} - ${b}.`,
      code: `print(${a} - ${b})`,
      output: String(a - b),
      distractors: [String(a + b), String(b - a), String(a - b + 1)],
      overview: 'The - operator subtracts the right operand from the left.',
      keyTerms: [{ term: '-', definition: 'Subtraction operator.' }],
      howItWorks: `${a} - ${b} = ${a - b}.`,
    }));
    out.push(make({
      cat: 'math-mul', concept: 'math', topics: ['math', 'operators'],
      title: 'Operator: * (multiplication)',
      description: `Compute ${a} * ${b}.`,
      code: `print(${a} * ${b})`,
      output: String(a * b),
      distractors: [String(a + b), String(a * b + 1), String(a * b - b)],
      overview: 'The * operator multiplies two numbers.',
      keyTerms: [{ term: '*', definition: 'Multiplication for numbers (repetition for sequences).' }],
      howItWorks: `${a} * ${b} = ${a * b}.`,
    }));
  }
  const powers = [[2, 3], [3, 2], [5, 2], [2, 4], [4, 2], [6, 2], [2, 5], [3, 3], [7, 2], [10, 2]];
  for (const [a, b] of powers) {
    out.push(make({
      cat: 'math-pow', concept: 'math', topics: ['math', 'operators'],
      title: 'Operator: ** (power)',
      description: `Compute ${a} ** ${b}.`,
      code: `print(${a} ** ${b})`,
      output: String(a ** b),
      distractors: [String(a * b), String(a ** b + 1), String(b ** a)],
      overview: 'The ** operator raises the left operand to the power of the right.',
      keyTerms: [{ term: '**', definition: 'Exponentiation operator.' }],
      howItWorks: `${a} multiplied by itself ${b} times is ${a ** b}.`,
    }));
    out.push(make({
      cat: 'math-prec', concept: 'math', topics: ['math', 'operators'],
      title: 'Operator precedence',
      description: `Evaluate ${a} + ${b} * 2.`,
      code: `print(${a} + ${b} * 2)`,
      output: String(a + b * 2),
      distractors: [String((a + b) * 2), String(a + b + 2), String(a * b * 2)],
      overview: 'Multiplication binds tighter than addition, so it happens first.',
      keyTerms: [{ term: 'precedence', definition: 'The order operators are applied; * before +.' }],
      howItWorks: `${b} * 2 = ${b * 2} is computed first, then + ${a} → ${a + b * 2}.`,
    }));
  }
  return out;
});

// --- Dicts ---------------------------------------------------------------
builders.push(() => {
  const out = [];
  for (const d of DICTS) {
    const keys = Object.keys(d.obj);
    const vals = Object.values(d.obj);
    const k = keys[0];
    out.push(make({
      cat: 'dict-get', concept: 'dicts', topics: ['dicts', 'methods'],
      title: 'Dict lookup by key',
      description: `Read d["${k}"].`,
      code: `d = ${d.code}\nprint(d["${k}"])`,
      output: String(d.obj[k]),
      distractors: [String(vals[1]), String(vals.length), `'${k}'`],
      overview: 'Indexing a dict with a key returns the associated value.',
      keyTerms: [{ term: 'key lookup', definition: 'd[key] returns the value stored under that key.' }],
      howItWorks: `The value stored under "${k}" is ${d.obj[k]}.`,
    }));
    out.push(make({
      cat: 'dict-len', concept: 'dicts', topics: ['dicts', 'built-ins'],
      title: 'Built-in: len() of a dict',
      description: 'Count the key/value pairs.',
      code: `d = ${d.code}\nprint(len(d))`,
      output: String(keys.length),
      distractors: [String(keys.length + 1), String(keys.length - 1), String(vals[0])],
      overview: 'len() on a dict counts its key/value pairs.',
      keyTerms: [{ term: 'len(dict)', definition: 'Number of keys in the dict.' }],
      howItWorks: `There are ${keys.length} keys, so len(d) is ${keys.length}.`,
    }));
    out.push(make({
      cat: 'dict-in', concept: 'dicts', topics: ['dicts', 'booleans'],
      title: 'Membership: key in dict',
      description: `Is "${k}" a key?`,
      code: `d = ${d.code}\nprint("${k}" in d)`,
      output: pyStr(true),
      distractors: [pyStr(false)],
      overview: 'The in operator on a dict checks whether a key exists.',
      keyTerms: [{ term: 'in (dict)', definition: 'Tests membership among the keys.' }],
      howItWorks: `"${k}" is a key of d, so the result is True.`,
    }));
    out.push(make({
      cat: 'dict-keys', concept: 'dicts', topics: ['dicts', 'methods'],
      title: 'sorted() of dict keys',
      description: 'Sort the keys.',
      code: `d = ${d.code}\nprint(sorted(d))`,
      output: pyStr([...keys].sort()),
      distractors: [pyStr(keys), pyStr(vals), pyStr([...keys].reverse())],
      difficulty: 'intermediate',
      overview: 'Iterating (and sorting) a dict uses its keys; sorted(d) returns the keys in order.',
      keyTerms: [{ term: 'sorted(dict)', definition: 'Returns the dict keys as a sorted list.' }],
      howItWorks: `The keys ${pyStr(keys)} sort to ${pyStr([...keys].sort())}.`,
    }));
    out.push(make({
      cat: 'dict-getdef', concept: 'dicts', topics: ['dicts', 'methods'],
      title: 'dict.get() with a default',
      description: 'Look up a missing key with a fallback.',
      code: `d = ${d.code}\nprint(d.get("missing", "none"))`,
      output: 'none',
      distractors: ['None', String(vals[0]), 'missing'],
      overview: 'dict.get(key, default) returns the default when the key is absent, instead of raising KeyError.',
      keyTerms: [{ term: 'dict.get()', definition: 'Safe lookup returning a default for missing keys.' }],
      howItWorks: '"missing" is not a key, so .get returns the fallback, "none".',
    }));
    out.push(make({
      cat: 'dict-values', concept: 'dicts', topics: ['dicts', 'methods'],
      title: 'list(dict.values())',
      description: 'Collect the values.',
      code: `d = ${d.code}\nprint(list(d.values()))`,
      output: pyStr(vals),
      distractors: [pyStr(keys), pyStr([...vals].reverse()), pyStr(vals.map((v) => v + 1))],
      difficulty: 'intermediate',
      overview: 'dict.values() is a view of the values; list() materializes them in insertion order.',
      keyTerms: [{ term: 'dict.values()', definition: 'A view of the values stored in the dict.' }],
      howItWorks: `The values of d are ${pyStr(vals)}.`,
    }));
  }
  return out;
});

// --- range / loops -------------------------------------------------------
builders.push(() => {
  const out = [];
  const range = (a, b, s = 1) => { const r = []; for (let i = a; s > 0 ? i < b : i > b; i += s) r.push(i); return r; };
  const single = [5, 4, 6, 3, 7, 8, 9, 10, 11, 12];
  for (const n of single) {
    out.push(make({
      cat: 'range-list', concept: 'loops', topics: ['loops', 'range'],
      title: 'list(range(n))',
      description: `Materialize range(${n}).`,
      code: `print(list(range(${n})))`,
      output: pyStr(range(0, n)),
      distractors: [pyStr(range(1, n + 1)), pyStr(range(0, n + 1)), pyStr(range(1, n))],
      overview: 'range(n) yields 0,1,…,n-1; list() turns the lazy range into a list.',
      keyTerms: [{ term: 'range(n)', definition: 'A lazy sequence from 0 up to (not including) n.' }],
      howItWorks: `range(${n}) yields 0 through ${n - 1} → ${pyStr(range(0, n))}.`,
    }));
    out.push(make({
      cat: 'range-sum', concept: 'loops', topics: ['loops', 'range', 'built-ins'],
      title: 'sum(range(n))',
      description: `Sum 0..${n - 1}.`,
      code: `print(sum(range(${n})))`,
      output: String((n * (n - 1)) / 2),
      distractors: [String((n * (n + 1)) / 2), String(n), String((n * (n - 1)) / 2 + 1)],
      difficulty: 'intermediate',
      overview: 'sum(range(n)) adds the integers 0 through n-1.',
      keyTerms: [{ term: 'sum + range', definition: 'A common idiom to total a numeric range.' }],
      howItWorks: `0 + 1 + … + ${n - 1} = ${(n * (n - 1)) / 2}.`,
    }));
  }
  const triples = [
    [2, 10, 2], [1, 6, 1], [0, 9, 3], [3, 12, 3], [5, 15, 5],
    [1, 7, 2], [0, 12, 3], [2, 20, 5], [4, 16, 4], [1, 10, 2], [3, 18, 3],
  ];
  for (const [a, b, s] of triples) {
    out.push(make({
      cat: 'range-step', concept: 'loops', topics: ['loops', 'range'],
      title: 'range with a step',
      description: `range(${a}, ${b}, ${s}).`,
      code: `print(list(range(${a}, ${b}, ${s})))`,
      output: pyStr(range(a, b, s)),
      distractors: [pyStr(range(a, b, 1)), pyStr(range(a, b + s, s)), pyStr(range(a, b, s).reverse())],
      difficulty: 'intermediate',
      overview: 'range(start, stop, step) counts from start in increments of step, excluding stop.',
      keyTerms: [{ term: 'range step', definition: 'The third argument sets the increment.' }],
      howItWorks: `Counting from ${a} by ${s} below ${b} → ${pyStr(range(a, b, s))}.`,
    }));
  }
  return out;
});

// --- f-strings -----------------------------------------------------------
builders.push(() => {
  const out = [];
  const names = ['Ada', 'Linus', 'Grace', 'Guido', 'Alan', 'Margaret', 'Dennis', 'Barbara', 'Katherine', 'Donald', 'Ken', 'Tim'];
  for (const name of names) {
    out.push(make({
      cat: 'fstr-name', concept: 'fstrings', topics: ['f-strings', 'strings'],
      title: 'f-string interpolation',
      description: 'Insert a variable into a string.',
      code: `name = "${name}"\nprint(f"Hello, {name}!")`,
      output: `Hello, ${name}!`,
      distractors: ['Hello, {name}!', `Hello, ${name}`, `hello, ${name}!`],
      overview: 'An f-string evaluates the expression inside {} and inserts its value into the string.',
      keyTerms: [{ term: 'f-string', definition: 'A string prefixed with f where {expr} is replaced by its value.' }],
      howItWorks: `{name} is replaced by "${name}" → "Hello, ${name}!".`,
    }));
  }
  const pairs = [[3, 4], [5, 6], [2, 9], [7, 8], [10, 1], [4, 5], [6, 7], [8, 2], [9, 3], [1, 6]];
  for (const [a, b] of pairs) {
    out.push(make({
      cat: 'fstr-expr', concept: 'fstrings', topics: ['f-strings', 'math'],
      title: 'f-string with an expression',
      description: 'Compute inside the braces.',
      code: `a = ${a}\nb = ${b}\nprint(f"{a} + {b} = {a + b}")`,
      output: `${a} + ${b} = ${a + b}`,
      distractors: [`{a} + {b} = {a + b}`, `${a} + ${b} = ${a}${b}`, `${a} + ${b} = ${a * b}`],
      overview: 'f-strings can contain full expressions; {a + b} is evaluated at runtime.',
      keyTerms: [{ term: 'embedded expression', definition: 'Any expression can go inside an f-string brace.' }],
      howItWorks: `{a + b} evaluates to ${a + b}, giving "${a} + ${b} = ${a + b}".`,
    }));
  }
  const floats = [
    [3.14159, '3.14'], [2.5, '2.50'], [9.807, '9.81'], [1.41421, '1.41'],
    [0.5, '0.50'], [6.283, '6.28'], [2.718, '2.72'], [1.5, '1.50'],
  ];
  for (const [x, formatted] of floats) {
    out.push(make({
      cat: 'fstr-fmt', concept: 'fstrings', topics: ['f-strings', 'formatting'],
      title: 'f-string number formatting',
      description: 'Format with two decimals.',
      code: `x = ${x}\nprint(f"{x:.2f}")`,
      output: formatted,
      distractors: [String(x), formatted.replace('.', ','), `{x:.2f}`],
      difficulty: 'intermediate',
      overview: 'The :.2f format spec renders a number with exactly two digits after the decimal point.',
      keyTerms: [{ term: 'format spec', definition: 'The text after : in a brace controls how the value is rendered.' }],
      howItWorks: `${x} formatted with .2f rounds/pads to "${formatted}".`,
    }));
  }
  return out;
});

// --- booleans / types ----------------------------------------------------
builders.push(() => {
  const out = [];
  const truthy = [
    ['0', false], ['5', true], ['-3', true], ['""', false], ['"x"', true],
    ['[]', false], ['[1]', true], ['{}', false], ['None', false], ['"0"', true],
    ['" "', true], ['100', true], ['0.0', false], ['[0]', true],
  ];
  for (const [expr, val] of truthy) {
    out.push(make({
      cat: 'bool-truth', concept: 'booleans', topics: ['booleans', 'built-ins'],
      title: 'Truthiness with bool()',
      description: `Evaluate bool(${expr}).`,
      code: `print(bool(${expr}))`,
      output: pyStr(val),
      distractors: [pyStr(!val)],
      overview: 'bool() applies Python truthiness: empty/zero/None are False, most other values True.',
      keyTerms: [{ term: 'truthiness', definition: 'How a value behaves in a boolean context.' }],
      howItWorks: `${expr} is ${val ? 'truthy' : 'falsy'}, so bool(${expr}) is ${val ? 'True' : 'False'}.`,
    }));
  }
  const types = [
    ['5', 'int'], ['"hi"', 'str'], ['[1, 2]', 'list'], ['3.5', 'float'],
    ['True', 'bool'], ['(1, 2)', 'tuple'], ['{"a": 1}', 'dict'], ['{1, 2}', 'set'],
  ];
  for (const [expr, t] of types) {
    out.push(make({
      cat: 'type-name', concept: 'types', topics: ['types', 'built-ins'],
      title: 'Inspecting a type',
      description: `What is type(${expr})?`,
      code: `print(type(${expr}).__name__)`,
      output: t,
      distractors: ['int', 'str', 'list', 'float', 'dict', 'tuple', 'bool', 'set'].filter((x) => x !== t),
      overview: 'type(x) returns the class of x; .__name__ gives that class name as a string.',
      keyTerms: [{ term: 'type()', definition: "Returns an object's class." }],
      howItWorks: `${expr} is a ${t}, so type(...).__name__ prints "${t}".`,
    }));
  }
  const logic = [
    ['True and False', false], ['True or False', true], ['not True', false],
    ['False or False', false], ['not False', true], ['True and True', true],
    ['not (True and False)', true], ['(True or False) and False', false],
    ['not (True or False)', false], ['False or (True and True)', true],
  ];
  for (const [expr, val] of logic) {
    out.push(make({
      cat: 'bool-logic', concept: 'booleans', topics: ['booleans', 'operators'],
      title: 'Boolean logic',
      description: `Evaluate ${expr}.`,
      code: `print(${expr})`,
      output: pyStr(val),
      distractors: [pyStr(!val)],
      overview: 'and/or/not combine booleans following standard logic rules.',
      keyTerms: [{ term: 'boolean operators', definition: 'and, or, not operate on truth values.' }],
      howItWorks: `${expr} evaluates to ${val ? 'True' : 'False'}.`,
    }));
  }
  return out;
});

/* ------------------------------- assemble --------------------------------- */

const CAPS = [90, 90, 100, 90, 40, 30, 30, 30]; // per builder, sums to 500
const TARGET_TOTAL = 500;

const curated = JSON.parse(readFileSync(resolve(ROOT, 'src/data/curated.json'), 'utf8'));
const generated = [];
const seenCode = new Set(curated.map((e) => e.code));

builders.forEach((build, i) => {
  const produced = build();
  let added = 0;
  for (const ex of produced) {
    if (added >= CAPS[i]) break;
    if (seenCode.has(ex.code)) continue;
    seenCode.add(ex.code);
    generated.push(ex);
    added += 1;
  }
});

// Link related exercises within the same category (prev/next neighbors).
const byCat = new Map();
for (const ex of generated) {
  const cat = ex.id.replace(/-\d+$/, '');
  if (!byCat.has(cat)) byCat.set(cat, []);
  byCat.get(cat).push(ex);
}
for (const group of byCat.values()) {
  group.forEach((ex, i) => {
    const rel = [group[i + 1], group[i - 1], group[i + 2]].filter(Boolean).map((e) => e.id).slice(0, 2);
    ex.explanation.relatedExercises = rel;
  });
}

const all = [...curated, ...generated].slice(0, TARGET_TOTAL);
writeFileSync(resolve(ROOT, 'src/data/exercises.json'), JSON.stringify(all, null, 2) + '\n');

const counts = {};
for (const e of all) (counts[e.difficulty] = (counts[e.difficulty] || 0) + 1);
console.log(`Wrote ${all.length} exercises (${curated.length} curated + ${all.length - curated.length} generated).`);
console.log('By difficulty:', counts);
