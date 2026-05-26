'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  registry,
  questionTypeList,
  questionTypeLabels,
  type QuestionType,
} from '@/question-types'
import type { Survey, Question } from '@/lib/types'
import { BranchingEditor } from '@/components/BranchingEditor'

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

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
      setTitle(data.title)
      setQuestions(data.data?.questions ?? [])
      setLoading(false)
    }
    loadSurvey()
  }, [id])

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('surveys')
      .update({ title, data: { questions } })
      .eq('id', id)
    setSaving(false)
    if (error) {
      console.error(error)
      return
    }
    setLastSaved(new Date())
  }

  function addQuestion(type: QuestionType) {
    const newId = `q_${Date.now()}`
    const newQuestion = registry[type].defaultValue(newId) as Question
    setQuestions([...questions, newQuestion])
  }

  function updateQuestion(idx: number, q: Question) {
    const next = [...questions]
    next[idx] = q
    setQuestions(next)
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setQuestions(next)
  }

  function exportJSON() {
    const payload = {
      id,
      title,
      createdAt: survey?.createdAt,
      updatedAt: new Date().toISOString(),
      questions,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'survey'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <main className="min-h-screen max-w-3xl mx-auto px-6 py-20">
        <div className="text-stone-400 text-sm">Loading…</div>
      </main>
    )
  }

  if (!survey) {
    return (
      <main className="min-h-screen max-w-3xl mx-auto px-6 py-20">
        <div className="text-stone-500 text-sm">Survey not found.</div>
        <Link
          href="/"
          className="text-sm text-accent hover:text-accent-hover underline mt-4 inline-block transition-colors"
        >
          Back to surveys
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-20">
      <header className="mb-16">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.2em] text-stone-400 hover:text-accent transition-colors"
        >
          ← Surveys
        </Link>
        <div className="flex items-end justify-between mt-4 gap-4 flex-wrap">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-5xl font-serif tracking-tight bg-transparent outline-none border-b border-transparent focus:border-stone-300 transition-colors flex-1 min-w-0"
            placeholder="Untitled survey"
          />
          <div className="flex items-center gap-5 text-sm shrink-0">
            {lastSaved && (
              <span className="text-xs text-stone-400 tracking-wider">
                Saved{' '}
                {lastSaved.toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            )}
            <button
              onClick={exportJSON}
              className="text-stone-500 hover:text-accent transition-colors"
            >
              Export
            </button>
            <Link
              href={`/surveys/${id}/take`}
              target="_blank"
              className="text-stone-500 hover:text-accent transition-colors"
            >
              Preview
            </Link>
            <button
              onClick={save}
              disabled={saving}
              className="bg-accent text-white px-5 py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {questions.length === 0 ? (
          <div className="border border-dashed border-stone-200 py-24 text-center space-y-5">
            <div className="text-3xl font-serif text-stone-400">
              What do you want to ask first?
            </div>
            <AddQuestionButton onAdd={addQuestion} />
          </div>
        ) : (
          <>
            {questions.map((q, i) => {
              const TypeEditor = registry[q.type as QuestionType]?.Editor
              if (!TypeEditor) return null
              return (
                <article
                  key={q.id}
                  className="group bg-white border border-stone-200 hover:border-accent/40 p-7 transition-colors"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-serif text-accent tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        {questionTypeLabels[q.type as QuestionType]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveQuestion(i, -1)}
                        disabled={i === 0}
                        className="hover:text-accent disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveQuestion(i, 1)}
                        disabled={i === questions.length - 1}
                        className="hover:text-accent disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeQuestion(i)}
                        className="hover:text-accent"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <TypeEditor
                    question={q as never}
                    onChange={(next: Question) => updateQuestion(i, next)}
                  />
                  <BranchingEditor
                    question={q}
                    allQuestions={questions}
                    currentIdx={i}
                    onChange={(branches) =>
                      updateQuestion(i, { ...q, branches })
                    }
                  />
                </article>
              )
            })}
            <div className="pt-2">
              <AddQuestionButton onAdd={addQuestion} />
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function AddQuestionButton({
  onAdd,
}: {
  onAdd: (type: QuestionType) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm border border-stone-300 bg-white px-5 py-2.5 hover:bg-accent hover:text-white hover:border-accent transition-colors"
      >
        + Add question
      </button>
      {open && (
        <div className="absolute mt-2 bg-white border border-stone-200 shadow-md z-10 min-w-[180px]">
          {questionTypeList.map((t) => (
            <button
              key={t}
              onClick={() => {
                onAdd(t)
                setOpen(false)
              }}
              className="block w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 hover:text-accent transition-colors"
            >
              {questionTypeLabels[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}