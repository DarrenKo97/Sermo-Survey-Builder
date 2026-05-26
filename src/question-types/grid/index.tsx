'use client'

import type { GridQuestion } from '@/lib/types'

export const defaultValue = (id: string): GridQuestion => ({
  id,
  type: 'grid',
  text: 'Untitled question',
  required: false,
  rows: [
    { id: 'row_1', label: 'Row 1' },
    { id: 'row_2', label: 'Row 2' },
  ],
  columns: [
    { id: 'col_1', label: 'Column 1' },
    { id: 'col_2', label: 'Column 2' },
    { id: 'col_3', label: 'Column 3' },
  ],
})

export function validate(
  question: GridQuestion,
  value: unknown
): string | null {
  const answers = (value ?? {}) as Record<string, string>
  const filled = Object.keys(answers).length > 0
  if (!filled) return question.required ? 'Required' : null
  if (typeof value !== 'object' || value === null) return 'Invalid value'
  if (question.required) {
    const allRowsAnswered = question.rows.every(
      (r) => answers[r.id] !== undefined
    )
    if (!allRowsAnswered) return 'Answer all rows'
  }
  for (const [rowId, colId] of Object.entries(answers)) {
    if (!question.rows.some((r) => r.id === rowId)) return 'Invalid row'
    if (!question.columns.some((c) => c.id === colId)) return 'Invalid column'
  }
  return null
}

// Grid as a branch source is not supported in v1. Easy to add later
// by giving each row/column a predicate, but it bloats the UI.
export const predicates = [] as const

export function Editor({
  question,
  onChange,
}: {
  question: GridQuestion
  onChange: (q: GridQuestion) => void
}) {
  const updateRow = (idx: number, label: string) => {
    const next = [...question.rows]
    next[idx] = { ...next[idx], label }
    onChange({ ...question, rows: next })
  }
  const updateCol = (idx: number, label: string) => {
    const next = [...question.columns]
    next[idx] = { ...next[idx], label }
    onChange({ ...question, columns: next })
  }
  const addRow = () =>
    onChange({
      ...question,
      rows: [...question.rows, { id: `row_${Date.now()}`, label: `Row ${question.rows.length + 1}` }],
    })
  const addCol = () =>
    onChange({
      ...question,
      columns: [...question.columns, { id: `col_${Date.now()}`, label: `Column ${question.columns.length + 1}` }],
    })
  const removeRow = (idx: number) =>
    onChange({ ...question, rows: question.rows.filter((_, i) => i !== idx) })
  const removeCol = (idx: number) =>
    onChange({ ...question, columns: question.columns.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        placeholder="Question text"
        className="w-full text-lg font-medium border-b border-neutral-200 focus:border-neutral-900 outline-none py-1 bg-transparent transition-colors"
      />
      <div className="grid grid-cols-2 gap-8 pl-1 pt-2">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-neutral-400">Rows</div>
          {question.rows.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2 group">
              <input
                type="text"
                value={r.label}
                onChange={(e) => updateRow(i, e.target.value)}
                className="flex-1 border-b border-transparent focus:border-neutral-300 outline-none py-1 bg-transparent text-sm"
              />
              {question.rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-900 text-xs transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={addRow} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            + Add row
          </button>
        </div>
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-neutral-400">Columns</div>
          {question.columns.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 group">
              <input
                type="text"
                value={c.label}
                onChange={(e) => updateCol(i, e.target.value)}
                className="flex-1 border-b border-transparent focus:border-neutral-300 outline-none py-1 bg-transparent text-sm"
              />
              {question.columns.length > 1 && (
                <button
                  onClick={() => removeCol(i)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-900 text-xs transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={addCol} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            + Add column
          </button>
        </div>
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
  question: GridQuestion
  value: Record<string, string> | undefined
  onChange: (v: Record<string, string>) => void
}) {
  const answers = value ?? {}
  return (
    <div className="space-y-4">
      <div className="text-lg">
        {question.text}
        {question.required && <span className="text-neutral-400 ml-1">*</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-1/3"></th>
              {question.columns.map((c) => (
                <th key={c.id} className="text-xs text-neutral-500 font-normal py-2 px-2 text-center">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {question.rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="text-sm py-3 pr-4">{r.label}</td>
                {question.columns.map((c) => (
                  <td key={c.id} className="text-center py-3 px-2">
                    <input
                      type="radio"
                      name={`${question.id}_${r.id}`}
                      value={c.id}
                      checked={answers[r.id] === c.id}
                      onChange={() => onChange({ ...answers, [r.id]: c.id })}
                      className="accent-neutral-900"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}