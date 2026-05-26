'use client'

import type { NumericQuestion } from '@/lib/types'

export const defaultValue = (id: string): NumericQuestion => ({
  id,
  type: 'numeric',
  text: 'Untitled question',
  required: false,
})

export function validate(
  question: NumericQuestion,
  value: unknown
): string | null {
  if (value === undefined) return question.required ? 'Required' : null
  if (typeof value !== 'number' || isNaN(value)) return 'Must be a number'
  if (question.min !== undefined && value < question.min) {
    return `Minimum ${question.min}`
  }
  if (question.max !== undefined && value > question.max) {
    return `Maximum ${question.max}`
  }
  return null
}

export const predicates = ['equals', 'notEquals', 'gt', 'lt'] as const

export function Editor({
  question,
  onChange,
}: {
  question: NumericQuestion
  onChange: (q: NumericQuestion) => void
}) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        placeholder="Question text"
        className="w-full text-lg font-medium border-b border-neutral-200 focus:border-neutral-900 outline-none py-1 bg-transparent transition-colors"
      />
      <div className="flex gap-6 pl-1 pt-2 flex-wrap">
        <label className="text-xs text-neutral-500 flex items-center gap-2">
          Min
          <input
            type="number"
            value={question.min ?? ''}
            onChange={(e) =>
              onChange({
                ...question,
                min: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
            className="w-20 border-b border-neutral-200 focus:border-neutral-900 outline-none py-1 bg-transparent text-sm"
          />
        </label>
        <label className="text-xs text-neutral-500 flex items-center gap-2">
          Max
          <input
            type="number"
            value={question.max ?? ''}
            onChange={(e) =>
              onChange({
                ...question,
                max: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
            className="w-20 border-b border-neutral-200 focus:border-neutral-900 outline-none py-1 bg-transparent text-sm"
          />
        </label>
        <label className="text-xs text-neutral-500 flex items-center gap-2">
          Decimals
          <input
            type="number"
            min={0}
            value={question.decimals ?? 0}
            onChange={(e) => onChange({ ...question, decimals: Number(e.target.value) })}
            className="w-16 border-b border-neutral-200 focus:border-neutral-900 outline-none py-1 bg-transparent text-sm"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs text-neutral-500 pt-2 pl-1">
        <input
          type="checkbox"
          checked={question.required}
          onChange={(e) => onChange({ ...question, required: e.target.checked })}
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
  question: NumericQuestion
  value: number | undefined
  onChange: (v: number | undefined) => void
}) {
  const handleChange = (raw: string) => {
    if (raw === '') {
      onChange(undefined)
      return
    }
    const n = Number(raw)
    if (isNaN(n)) return
    onChange(n)
  }

  const outOfRange =
    typeof value === 'number' &&
    ((question.min !== undefined && value < question.min) ||
      (question.max !== undefined && value > question.max))

  const rangeLabel =
    question.min !== undefined && question.max !== undefined
      ? `Between ${question.min} and ${question.max}`
      : question.min !== undefined
        ? `Minimum ${question.min}`
        : question.max !== undefined
          ? `Maximum ${question.max}`
          : null

  return (
    <div className="space-y-3">
      <div className="text-2xl font-serif leading-snug">
        {question.text}
        {question.required && <span className="text-stone-400 ml-1">*</span>}
        </div>
      <input
        type="number"
        min={question.min}
        max={question.max}
        step={
          question.decimals && question.decimals > 0
            ? Math.pow(10, -question.decimals)
            : 1
        }
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-32 border-b outline-none py-2 bg-transparent text-lg transition-colors ${
          outOfRange
            ? 'border-red-500'
            : 'border-neutral-200 focus:border-neutral-900'
        }`}
      />
      {outOfRange ? (
        <div className="text-xs text-red-600">{rangeLabel ?? 'Out of range'}</div>
      ) : rangeLabel ? (
        <div className="text-xs text-neutral-400">{rangeLabel}</div>
      ) : null}
    </div>
  )
}