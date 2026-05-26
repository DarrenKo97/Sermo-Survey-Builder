'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { registry, type QuestionType } from '@/question-types'
import type { Survey, Question, Answers, Branch } from '@/lib/types'

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
        <div className="text-neutral-400 text-sm">Loading…</div>
      </main>
    )
  }

  if (!survey || survey.questions.length === 0) {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-6 py-24">
        <div className="text-neutral-500 text-sm">
          This survey has no questions yet.
        </div>
        <Link
          href={`/surveys/${id}/edit`}
          className="text-sm text-neutral-900 underline mt-4 inline-block"
        >
          Back to editor
        </Link>
      </main>
    )
  }

  if (done) {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-6 py-24">
        <div className="border-l-2 border-neutral-900 pl-6">
          <div className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
            Complete
          </div>
          <h2 className="text-2xl font-medium mb-6">Thank you.</h2>
          <details className="text-sm text-neutral-500">
            <summary className="cursor-pointer hover:text-neutral-900">
              View captured answers
            </summary>
            <pre className="mt-3 p-4 bg-neutral-50 text-xs overflow-auto">
              {JSON.stringify(answers, null, 2)}
            </pre>
          </details>
          <div className="mt-8 flex gap-4 text-sm">
            <Link
              href={`/surveys/${id}/edit`}
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Back to editor
            </Link>
            <button
              onClick={() => {
                setAnswers({})
                setHistory([0])
                setDone(false)
              }}
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
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
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-24">
      <header className="mb-12">
        <div className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
          {survey.title}
        </div>
        <div className="h-px bg-neutral-100">
          <div
            className="h-full bg-neutral-900 transition-all duration-300"
            style={{
              width: `${((currentIdx + 1) / survey.questions.length) * 100}%`,
            }}
          />
        </div>
      </header>

      <div className="space-y-10">
        {TypeRespondent && (
          <TypeRespondent
            question={q as never}
            value={answers[q.id] as never}
            onChange={(v: unknown) =>
              setAnswers({ ...answers, [q.id]: v as never })
            }
          />
        )}
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={back}
              className="text-neutral-500 hover:text-neutral-900 transition-colors px-4 py-2"
            >
              ← Back
            </button>
          )}
          <button
            onClick={advance}
            disabled={!canAdvance}
            className="bg-neutral-900 text-white px-6 py-2 hover:bg-neutral-700 transition-colors disabled:opacity-30"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </main>
  )
}