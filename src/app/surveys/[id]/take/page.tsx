'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { registry, type QuestionType } from '@/question-types'
import type { Survey, Question, Answers, Branch } from '@/lib/types'

function formatAnswer(question: Question, value: unknown): string {
  if (value === undefined || value === null) return '—'

  switch (question.type) {
    case 'singleSelect': {
      const option = question.options.find((o) => o.id === value)
      return option?.label ?? String(value)
    }
    case 'multiSelect': {
      if (!Array.isArray(value)) return '—'
      return question.options
        .filter((o) => value.includes(o.id))
        .map((o) => o.label)
        .join(', ')
    }
    case 'numeric': {
      return String(value)
    }
    case 'grid': {
      if (typeof value !== 'object' || value === null) return '—'
      const v = value as Record<string, string>
      return question.rows
        .map((row) => {
          const colId = v[row.id]
          const col = question.columns.find((c) => c.id === colId)
          return `${row.label}: ${col?.label ?? '—'}`
        })
        .join('\n')
    }
    case 'ranking': {
      if (!Array.isArray(value)) return '—'
      return value
        .map((itemId, idx) => {
          const item = question.items.find((i) => i.id === itemId)
          return `${idx + 1}. ${item?.label ?? itemId}`
        })
        .join('\n')
    }
    default:
      return String(value)
  }
}

export default function TakePage() {
  const { id } = useParams<{ id: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Answers>({})
  const [history, setHistory] = useState<number[]>([0])
  const currentIdx = history[history.length - 1]
  const canGoBack = history.length > 1
  const [done, setDone] = useState(false)

  useEffect(() => {
    const loadSurvey = async () => {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) {
        console.error(error)
        setLoading(false)
        return
      }
      setSurvey({
        id: data.id,
        title: data.title,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        questions: data.data?.questions ?? [],
      })
      setLoading(false)
    }
    loadSurvey()
  }, [id])

  function matchesBranch(answer: unknown, branch: Branch): boolean {
    const { op, value } = branch.if
    switch (op) {
      case 'equals':
        return answer === value
      case 'notEquals':
        return answer !== value
      case 'includes':
        return Array.isArray(answer) && answer.includes(value as string)
      case 'gt':
        return typeof answer === 'number' && answer > Number(value)
      case 'lt':
        return typeof answer === 'number' && answer < Number(value)
    }
  }

  function nextIndex(q: Question): number | 'end' {
    if (!survey) return 'end'
    const answer = answers[q.id]
    if (q.branches && q.branches.length > 0) {
      for (const b of q.branches) {
        if (matchesBranch(answer, b)) {
          if (b.then.goto === 'end') return 'end'
          const targetIdx = survey.questions.findIndex(
            (x) => x.id === b.then.goto
          )
          if (targetIdx > currentIdx) return targetIdx
        }
      }
    }
    if (currentIdx === survey.questions.length - 1) return 'end'
    return currentIdx + 1
  }

  function advance() {
    if (!survey) return
    const next = nextIndex(survey.questions[currentIdx])
    if (next === 'end') {
      setDone(true)
    } else {
      setHistory([...history, next])
    }
  }

  function back() {
    if (history.length <= 1) return
    setHistory(history.slice(0, -1))
  }

  if (loading) {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-6 py-24">
        <div className="text-stone-400 text-sm">Loading…</div>
      </main>
    )
  }

  if (!survey || survey.questions.length === 0) {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-6 py-24">
        <div className="text-stone-500 text-sm">
          This survey has no questions yet.
        </div>
        <Link
          href={`/surveys/${id}/edit`}
          className="text-sm text-accent hover:text-accent-hover underline mt-4 inline-block transition-colors"
        >
          Back to editor
        </Link>
      </main>
    )
  }

if (done) {
    const answered = survey.questions.filter(
      (q) => answers[q.id] !== undefined
    )

    return (
      <main className="min-h-screen max-w-2xl mx-auto px-6 py-24">
        <div className="border-l-2 border-accent pl-8">
          <div className="text-xs uppercase tracking-[0.2em] text-accent mb-4">
            Complete
          </div>
          <h2 className="text-5xl font-serif mb-8 tracking-tight">
            Thank You!
          </h2>

          {answered.length > 0 && (
            <details className="bg-stone-200 rounded-lg p-6 text-sm">
              <summary className="cursor-pointer text-stone-700 hover:text-stone-900 transition-colors">
                Review your responses
              </summary>
              <dl className="mt-6 space-y-6">
                {answered.map((q) => (
                  <div key={q.id}>
                    <dt className="text-sm text-stone-600 mb-1">
                      {q.text}
                    </dt>
                    <dd className="text-base text-stone-900 leading-relaxed whitespace-pre-line">
                      {formatAnswer(q, answers[q.id])}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          )}

          <div className="mt-10 flex gap-5 text-sm">
            <Link
              href={`/surveys/${id}/edit`}
              className="text-stone-500 hover:text-accent transition-colors"
            >
              Back to editor
            </Link>
            <button
              onClick={() => {
                setAnswers({})
                setHistory([0])
                setDone(false)
              }}
              className="text-stone-500 hover:text-accent transition-colors"
            >
              Restart
            </button>
          </div>
        </div>
      </main>
    )
  }

  const q = survey.questions[currentIdx]
  const TypeRespondent = registry[q.type as QuestionType]?.Respondent
  const isLast = currentIdx === survey.questions.length - 1
  const validateFn = registry[q.type as QuestionType]?.validate
  const validationError = validateFn
    ? validateFn(q as never, answers[q.id] as never)
    : null
  const canAdvance = validationError === null

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-20">
      <header className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-[0.2em] text-stone-500">
            {survey.title}
          </div>
          <div className="text-xs text-stone-400 tabular-nums">
            {currentIdx + 1} / {survey.questions.length}
          </div>
        </div>
        <div className="h-px bg-stone-200">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{
              width: `${((currentIdx + 1) / survey.questions.length) * 100}%`,
            }}
          />
        </div>
      </header>

      <div className="space-y-12">
        {TypeRespondent && (
          <TypeRespondent
            question={q as never}
            value={answers[q.id] as never}
            onChange={(v: unknown) =>
              setAnswers({ ...answers, [q.id]: v as never })
            }
          />
        )}
        <div className="flex items-center gap-3 pt-2">
          {canGoBack && (
            <button
              onClick={back}
              className="text-stone-500 hover:text-accent transition-colors px-4 py-2.5"
            >
              ← Back
            </button>
          )}
          <button
            onClick={advance}
            disabled={!canAdvance}
            className="bg-accent text-white px-8 py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </main>
  )
}