'use client'

import type { SingleSelectQuestion } from '@/lib/types'

export const defaultValue = (id: string): SingleSelectQuestion => ({
  id,
  type: 'singleSelect',
  text: 'Untitled question',
  required: false,
  options: [
    { id: 'opt_1', label: 'Option 1' },
    { id: 'opt_2', label: 'Option 2' },
  ],
})

export function validate(
  question: SingleSelectQuestion,
  value: unknown
): string | null {
  if (value === undefined || value === '') {
    return question.required ? 'Required' : null
  }
  if (typeof value !== 'string') return 'Invalid value'
  if (!question.options.some((o) => o.id === value)) return 'Invalid option'
  return null
}

export const predicates = ['equals', 'notEquals'] as const

export function Editor({
  question,
  onChange,
}: {
  question: SingleSelectQuestion
  onChange: (q: SingleSelectQuestion) => void
}) {
  const addOption = () => {
    const nextNum = question.options.length + 1
    onChange({
      ...question,
      options: [
        ...question.options,
        { id: `opt_${Date.now()}`, label: `Option ${nextNum}` },
      ],
    })
  }

  const updateOption = (idx: number, label: string) => {
    const next = [...question.options]
    next[idx] = { ...next[idx], label }
    onChange({ ...question, options: next })
  }

  const removeOption = (idx: number) => {
    onChange({
      ...question,
      options: question.options.filter((_, i) => i !== idx),
    })
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        placeholder="Question text"
        className="w-full text-lg font-medium border-b border-neutral-200 focus:border-neutral-900 outline-none py-1 bg-transparent transition-colors"
      />
      <div className="space-y-2 pl-1">
        {question.options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-3 group">
            <span className="w-3 h-3 rounded-full border border-neutral-300 shrink-0" />
            <input
              type="text"
              value={opt.label}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1 border-b border-transparent focus:border-neutral-300 outline-none py-1 bg-transparent text-sm"
            />
            {question.options.length > 2 && (
              <button
                onClick={() => removeOption(i)}
                className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-900 text-xs transition-opacity"
                aria-label="Remove option"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addOption}
        className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors pl-6"
      >
        + Add option
      </button>
      <label className="flex items-center gap-2 text-xs text-neutral-500 pt-2">
        <input
          type="checkbox"
          checked={question.required}
          onChange={(e) =>
            onChange({ ...question, required: e.target.checked })
          }
        />
        Required
      </label>
    </div>
  )
}

export function Respondent({
  question,
  value,
  onChange,
}: {
  question: SingleSelectQuestion
  value: string | undefined
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="text-2xl font-serif leading-snug">
        {question.text}
        {question.required && <span className="text-stone-400 ml-1">*</span>}
      </div>
      <div className="space-y-2">
        {question.options.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center gap-3 cursor-pointer py-1 px-2 -mx-2 rounded hover:bg-neutral-50 transition-colors"
          >
            <input
              type="radio"
              name={question.id}
              value={opt.id}
              checked={value === opt.id}
              onChange={(e) => onChange(e.target.value)}
              className="accent-neutral-900"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}