# Sermo Survey Builder

A small survey builder built as a take-home assignment. Create surveys with single-select, multi-select, numeric, and grid questions; branch between them; preview as a respondent; export the definition as JSON.

- **Live demo:** [My Vercel Application](https://sermo-survey-builder.vercel.app/)
- **Repo:** [My Github Repo](https://github.com/DarrenKo97/Sermo-Survey-Builder)

## Quickstart

```bash
git clone https://github.com/your-username/sermo-survey-builder.git
cd sermo-survey-builder
npm install
```

Create `.env.local` at the project root with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
```

Run the schema in your Supabase SQL editor (see `supabase-schema.sql` below if you want it as a file, or copy from this README's appendix).

```bash
npm run dev
```

Open `http://localhost:3000`.

## Architecture in 60 seconds

```
src/
  app/                  Next.js App Router pages
    page.tsx            Survey list + create
    surveys/[id]/
      edit/page.tsx     Builder
      take/page.tsx     Respondent preview
  components/
    BranchingEditor.tsx Inline branching UI, shared across types
  lib/
    types.ts            Survey, Question, Branch type definitions
    supabase.ts         Supabase client
  question-types/       The thing that makes this extensible
    index.ts            Registry: maps type name to module
    singleSelect/
    multiSelect/
    numeric/
    grid/
```

The builder, respondent, and branching UI know nothing about specific question types. They look types up in `registry` and dispatch by `question.type`. To add a new question type, you don't touch the builder, the respondent, the branching UI, the database schema, or the JSON export. You add one folder and one line.

## How to add a new question type

A worked example: adding a **ranking** question, where the respondent reorders a list of items.

**1. Copy the singleSelect folder.**

```bash
cp -r src/question-types/singleSelect src/question-types/ranking
```

(On Windows: copy the folder in VS Code's Explorer pane.)

**2. Add the type to `src/lib/types.ts`.**

Two changes. Add a new question shape:

```ts
export type RankingQuestion = BaseQuestion & {
  type: 'ranking'
  items: Option[]
}
```

And add it to the `Question` union:

```ts
export type Question =
  | SingleSelectQuestion
  | MultiSelectQuestion
  | NumericQuestion
  | GridQuestion
  | RankingQuestion       // <-- add this
```

**3. Implement the five exports in `src/question-types/ranking/index.tsx`.**

Every question type module exports the same five things:

| Export         | What it is                                                           |
| -------------- | -------------------------------------------------------------------- |
| `defaultValue` | A function `(id: string) => Question` that returns a fresh instance  |
| `predicates`   | A `readonly Operator[]` listing which branching operators this type supports |
| `Editor`       | React component for the builder side: props `{ question, onChange }` |
| `Respondent`   | React component for the taker side: props `{ question, value, onChange }` |
| `validate`     | `(question, value) => string \| null` — error message or null if valid |

For ranking specifically:

```tsx
'use client'

import type { RankingQuestion } from '@/lib/types'

export const defaultValue = (id: string): RankingQuestion => ({
  id,
  type: 'ranking',
  text: 'Untitled question',
  required: false,
  items: [
    { id: 'item_1', label: 'Item 1' },
    { id: 'item_2', label: 'Item 2' },
    { id: 'item_3', label: 'Item 3' },
  ],
})

// Ranking as a branch source is not supported in v1. Skip it.
export const predicates = [] as const

export function validate(
  question: RankingQuestion,
  value: unknown
): string | null {
  if (value === undefined) return question.required ? 'Required' : null
  if (!Array.isArray(value)) return 'Invalid value'
  if (value.length !== question.items.length) return 'Rank all items'
  return null
}

export function Editor({
  question,
  onChange,
}: {
  question: RankingQuestion
  onChange: (q: RankingQuestion) => void
}) {
  // (item editing, identical pattern to singleSelect's option editing)
  // ...
}

export function Respondent({
  question,
  value,
  onChange,
}: {
  question: RankingQuestion
  value: string[] | undefined
  onChange: (v: string[]) => void
}) {
  // (up/down buttons that reorder; emit the ordered ID array)
  // ...
}
```

**4. Register it in `src/question-types/index.ts`.**

```ts
import * as singleSelect from './singleSelect'
import * as multiSelect from './multiSelect'
import * as numeric from './numeric'
import * as grid from './grid'
import * as ranking from './ranking'    // <-- add

export const registry = {
  singleSelect,
  multiSelect,
  numeric,
  grid,
  ranking,                              // <-- add
} as const

export const questionTypeLabels: Record<QuestionType, string> = {
  singleSelect: 'Single select',
  multiSelect: 'Multi select',
  numeric: 'Number',
  grid: 'Grid',
  ranking: 'Ranking',                   // <-- add
}
```

**That's the whole change.** No edits to the builder, the respondent shell, the branching UI, the database, the JSON export, or any other type. The registry dispatches by `question.type`, and the new type just plugs in.

The shape of the JSON column in Supabase doesn't change either, because each survey is stored as a single JSONB blob. The schema is the survey's shape, defined in TypeScript and validated at the boundary, not in Postgres.

## Why this works for AI coding agents

The contract is small, named, and uniform. The five exports per type are the same five exports every time, in the same five places. An agent extending this codebase doesn't need to read the builder, the respondent, the dispatch logic, or the persistence layer. It needs to read one folder (`singleSelect/`) as a reference, copy it, and modify the five exports.

The repo ships with `AGENTS.md` and `CLAUDE.md` (generated by `create-next-app`) which point coding agents at the right Next.js patterns. Combined with this README's contract description, an agent has everything it needs.

## What I deliberately didn't build

Three Qualtrics features explicitly cut from v1, picked for this user (pharma clinical research and insights teams surveying verified physicians on Sermo's panel):

1. **Question and choice randomization.** Sermo's panel team handles audience selection upstream. Physicians on a verified panel aren't a general-public sample where order effects need rigorous randomization. v1.1 if a methodology team asks.
2. **Quotas and response caps.** N-counts and audience targeting live on Sermo's recruitment side, not in the survey tool. Building quota management into the builder duplicates a system the platform already has.
3. **Multi-language and translation workflows.** Pharma studies are scoped per-language per-study. English-only v1 is fine; i18n in the builder is a large engineering investment for zero v1 benefit.

## Open items and what I'd do with more time

- **Lock down RLS.** The demo uses a wide-open RLS policy so anyone with a survey URL can edit it. For real use, surveys would be scoped by user or org. The policy lives in the SQL appendix.
- **Drag-and-drop reorder.** Currently questions reorder via up/down buttons. dnd-kit gets you there in about 30 minutes.
- **Server-side autosave with conflict resolution.** Currently a manual Save button. Debounced autosave + last-write-wins would feel better; real conflict resolution is harder and out of scope.
- **Response collection.** The respondent flow ends with a "Thank you" screen and `console.log` of the answers. Persisting answers to a `responses` table is the obvious next step.
- **Builder validation.** The builder lets you save invalid configurations (e.g. min > max on numeric). Validation at save time would catch these.

## Tool use

Built with Claude for architecture and code, in roughly three hours of focused build time after Qualtrics recon and writeup work. Every file in `src/` was reviewed by hand before commit. Vercel for hosting, Supabase for storage.

---

## Appendix: Supabase schema

```sql
create table surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled survey',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table surveys enable row level security;

create policy "Allow all for demo"
  on surveys for all
  using (true)
  with check (true);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger surveys_updated_at
  before update on surveys
  for each row
  execute function update_updated_at();
```
