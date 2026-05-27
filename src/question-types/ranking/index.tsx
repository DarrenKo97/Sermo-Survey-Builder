'use client'

import type { RankingQuestion } from '@/lib/types'
import { useEffect, useState } from 'react'

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

// Ranking as a branch source isn't supported in v1.
export const predicates = [] as const

export function validate(
  question: RankingQuestion,
  value: unknown
): string | null {
  if (value === undefined) return question.required ? 'Required' : null
  if (!Array.isArray(value)) return 'Invalid value'
  if (value.length !== question.items.length) return 'Rank all items'
  const ids = new Set(value)
  if (ids.size !== value.length) return 'Duplicate items'
  if (!value.every((v) => question.items.some((i) => i.id === v))) {
    return 'Invalid item'
  }
  return null
}

export function Editor({
  question,
  onChange,
}: {
  question: RankingQuestion
  onChange: (q: RankingQuestion) => void
}) {
  const addItem = () =>
    onChange({
      ...question,
      items: [
        ...question.items,
        { id: `item_${Date.now()}`, label: `Item ${question.items.length + 1}` },
      ],
    })
  const updateItem = (idx: number, label: string) => {
    const next = [...question.items]
    next[idx] = { ...next[idx], label }
    onChange({ ...question, items: next })
  }
  const removeItem = (idx: number) =>
    onChange({ ...question, items: question.items.filter((_, i) => i !== idx) })

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
        {question.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3 group">
            <span className="w-3 h-3 bg-neutral-300 shrink-0" />
            <input
              type="text"
              value={item.label}
              onChange={(e) => updateItem(i, e.target.value)}
              className="flex-1 border-b border-transparent focus:border-neutral-300 outline-none py-1 bg-transparent text-sm"
            />
            {question.items.length > 1 && (
              <button
                onClick={() => removeItem(i)}
                className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-900 text-xs transition-opacity"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors pl-6"
      >
        + Add item
      </button>
    </div>
  )
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
    useEffect(() => {
     if (value === undefined) {
       onChange(question.items.map((item) => item.id))
     }
   }, [value, question.items, onChange])

  const order =
    value && value.length === question.items.length
      ? value
      : question.items.map((i) => i.id)

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="text-2xl font-serif leading-snug">
        {question.text}
        {question.required && <span className="text-stone-400 ml-1">*</span>}
        </div>
      <div className="space-y-1">
        {order.map((itemId, i) => {
          const item = question.items.find((x) => x.id === itemId)
          if (!item) return null
          return (
            <div
              key={itemId}
              className="flex items-center gap-3 py-2 px-3 border border-neutral-100 hover:border-neutral-300 transition-colors"
            >
              <span className="text-xs uppercase tracking-wider text-neutral-400 w-6">
                {i + 1}
              </span>
              <span className="flex-1 text-sm">{item.label}</span>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30 text-xs leading-none"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30 text-xs leading-none"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}