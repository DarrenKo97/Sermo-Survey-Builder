# decisions.md

Working doc. Locked before I write a line of code.

## Three cuts

Features Qualtrics has that I'm not building in v1.

**1. Question and choice randomization.**
Sermo's panel team handles audience selection upstream. Physicians on a verified panel aren't a general-public sample where order effects need rigorous randomization. If a methodology team asks for it later, we add it. For now, the survey shows in the order I built it.

**2. Quotas and response caps.**
N-counts and audience targeting live on Sermo's recruitment side, not in the survey tool. Building quota management into v1 duplicates a system the platform already has. The survey's job is to collect responses, not to decide who gets to respond or cut off at N=50.

**3. Multi-language and translation workflows.**
Pharma studies are scoped per-language per-study. English-only v1 is fine. The engineering cost of i18n in the builder (translation panes, language switching, per-language preview) is large and the v1 benefit is zero. v2 problem.

Considered and kept anyway: branching (required), grid (required), JSON export (required).
Next on the chopping block if I had to cut more: themes and custom branding, piping/dynamic text, carry-forward choices.

## Question-type contract

Every type lives in `/question-types/<name>/` and exports exactly five things.

```ts
// /question-types/singleSelect/index.ts
export const schema = z.object({ ... })       // Zod schema for the question config
export const defaultValue = { ... }            // what a fresh question looks like
export const Editor = (props) => ...           // builder-side React component
export const Respondent = (props) => ...       // taker-side React component
export const predicates = ['equals', 'notEquals'] as const
```

Then `/question-types/index.ts` is one file:

```ts
import * as singleSelect from './singleSelect'
import * as multiSelect from './multiSelect'
import * as numeric from './numeric'
import * as grid from './grid'

export const registry = { singleSelect, multiSelect, numeric, grid }
export type QuestionType = keyof typeof registry
```

The editor shell and the respondent shell both dispatch by `question.type` and render `registry[question.type].Editor` or `.Respondent`. They don't know specific types. They just call the registry.

To add a fifth type (say, ranking):

1. Copy `/question-types/singleSelect/` to `/question-types/ranking/`
2. Update the five exports for ranking semantics
3. Add `import * as ranking from './ranking'` and put `ranking` in the registry export

No edits to the editor shell, the respondent shell, the database schema (it stores the question config as JSON), or the export pipeline.

## Branching

One primitive. Lives on the question that triggers it.

```ts
type Operator = 'equals' | 'notEquals' | 'includes' | 'gt' | 'lt'

type Branch = {
  if: { questionId: string, op: Operator, value: string | number }
  then: { goto: string | 'end' }   // target questionId or end of survey
}

// on the question:
question.branches: Branch[]
```

Each question type declares which operators it supports via `predicates`. The branch editor reads `predicates` for the answering question and only shows the valid operators.

No blocks, no separate Survey Flow screen, no display-logic-vs-skip-logic-vs-branch-logic split. One concept, configured inline with the question.

## Survey JSON shape

The export contract. What hits disk, what hits the database, what the JSON download button returns.

```ts
{
  id: string,
  title: string,
  createdAt: string,        // ISO
  updatedAt: string,        // ISO
  questions: [
    {
      id: string,           // stable, e.g. 'q_specialty'
      type: 'singleSelect' | 'multiSelect' | 'numeric' | 'grid',
      text: string,
      required: boolean,
      // type-specific fields
      options?: { id: string, label: string }[],     // single/multi-select
      min?: number,
      max?: number,
      decimals?: number,                              // numeric
      rows?: { id: string, label: string }[],
      columns?: { id: string, label: string }[],     // grid
      branches?: Branch[]
    }
  ]
}
```

Order of `questions[]` is the order of presentation. No blocks. No trash bin. No separate flow object. Fits on one page. A human can hand-edit it.

## Stack

- Next.js (App Router) + TypeScript
- React + Tailwind
- Zod for schemas and type inference
- Supabase (or Vercel Postgres) with a single table: `surveys (id, json, updated_at)`
- Vercel for hosting

Choosing this because I can ship it and live-extend it in front of them without thinking. Not the time to learn anything new.

## Build plan, hard-capped at 3 hours

**Hour 1.** Vertical slice. Single-select end to end: create, edit text and options, persist, preview, answer it, export the JSON. Round-trip works before I move on.

**Hour 2.** Breadth. Multi-select, numeric, grid using the same contract. Reorder and delete. Branching primitive inline on the question. Preview routes correctly.

**Hour 3.** Deploy. Polish the empty state and the question-add interaction. Write the README with run instructions and the "how to add a question type" tutorial. Stop at 3:00 even mid-feature.

## Pre-submit QA

Before I submit, add a fifth question type (ranking) using my own tutorial. Time it. If it takes more than 30 minutes, the contract is wrong and I fix it before shipping. Then delete the ranking type (or keep it as a bonus) and send.
