'use client'

import type { Question, Branch, Operator } from '@/lib/types'
import { registry, type QuestionType } from '@/question-types'

export function BranchingEditor({
  question,
  allQuestions,
  currentIdx,
  onChange,
}: {
  question: Question
  allQuestions: Question[]
  currentIdx: number
  onChange: (branches: Branch[]) => void
}) {
  const predicates = registry[question.type as QuestionType]
    ?.predicates as readonly Operator[]
  if (!predicates || predicates.length === 0) return null

  const branches = question.branches ?? []
  const laterQuestions = allQuestions.slice(currentIdx + 1)

  const addBranch = () => {
    const newBranch: Branch = {
      if: { questionId: question.id, op: predicates[0], value: '' },
      then: { goto: laterQuestions[0]?.id ?? 'end' },
    }
    onChange([...branches, newBranch])
  }
  const updateBranch = (idx: number, b: Branch) => {
    const next = [...branches]
    next[idx] = b
    onChange(next)
  }
  const removeBranch = (idx: number) => onChange(branches.filter((_, i) => i !== idx))

  return (
    <div className="mt-6 pt-4 border-t border-dashed border-neutral-100">
      <div className="text-xs uppercase tracking-wider text-neutral-400 mb-3">Branching</div>
      <div className="space-y-3">
        {branches.map((b, i) => (
          <BranchRow
            key={i}
            branch={b}
            question={question}
            predicates={predicates}
            laterQuestions={laterQuestions}
            onChange={(next) => updateBranch(i, next)}
            onRemove={() => removeBranch(i)}
          />
        ))}
        <button onClick={addBranch} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
          + Add branch
        </button>
      </div>
    </div>
  )
}

function BranchRow({
  branch,
  question,
  predicates,
  laterQuestions,
  onChange,
  onRemove,
}: {
  branch: Branch
  question: Question
  predicates: readonly Operator[]
  laterQuestions: Question[]
  onChange: (b: Branch) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 text-xs flex-wrap">
      <span className="text-neutral-400">If answer</span>
      <select
        value={branch.if.op}
        onChange={(e) =>
          onChange({ ...branch, if: { ...branch.if, op: e.target.value as Operator } })
        }
        className="bg-transparent border-b border-neutral-200 focus:border-neutral-900 outline-none py-1 cursor-pointer"
      >
        {predicates.map((p) => (
          <option key={p} value={p}>{opLabel(p)}</option>
        ))}
      </select>
      <BranchValueInput
        question={question}
        value={branch.if.value}
        onChange={(v) => onChange({ ...branch, if: { ...branch.if, value: v } })}
      />
      <span className="text-neutral-400">→ go to</span>
      <select
        value={branch.then.goto}
        onChange={(e) => onChange({ ...branch, then: { goto: e.target.value } })}
        className="bg-transparent border-b border-neutral-200 focus:border-neutral-900 outline-none py-1 cursor-pointer max-w-[200px]"
      >
        {laterQuestions.map((q) => (
          <option key={q.id} value={q.id}>{q.text || '(untitled)'}</option>
        ))}
        <option value="end">End of survey</option>
      </select>
      <button onClick={onRemove} className="ml-auto text-neutral-400 hover:text-neutral-900 transition-colors">
        Remove
      </button>
    </div>
  )
}

function opLabel(op: Operator): string {
  switch (op) {
    case 'equals': return 'is'
    case 'notEquals': return 'is not'
    case 'includes': return 'includes'
    case 'gt': return 'is greater than'
    case 'lt': return 'is less than'
  }
}

function BranchValueInput({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string | number
  onChange: (v: string | number) => void
}) {
  if (question.type === 'singleSelect' || question.type === 'multiSelect') {
    return (
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-b border-neutral-200 focus:border-neutral-900 outline-none py-1 cursor-pointer max-w-[180px]"
      >
        <option value="">Pick option…</option>
        {question.options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
    )
  }
  if (question.type === 'numeric') {
    return (
      <input
        type="number"
        value={value === '' ? '' : Number(value)}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-20 bg-transparent border-b border-neutral-200 focus:border-neutral-900 outline-none py-1"
      />
    )
  }
  return null
}