'use client'

import { useEffect, useState } from 'react'
import { BranchingEditor } from '@/components/BranchingEditor'
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
      <main className="min-h-screen max-w-3xl mx-auto px-6 py-16">
        <div className="text-neutral-400 text-sm">Loading…</div>
      </main>
    )
  }

  if (!survey) {
    return (
      <main className="min-h-screen max-w-3xl mx-auto px-6 py-16">
        <div className="text-neutral-500 text-sm">Survey not found.</div>
        <Link
          href="/"
          className="text-sm text-neutral-900 underline mt-4 inline-block"
        >
          Back to surveys
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <Link
          href="/"
          className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          ← All surveys
        </Link>
        <div className="flex items-end justify-between mt-3 gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-medium tracking-tight bg-transparent outline-none border-b border-transparent focus:border-neutral-300 transition-colors flex-1 min-w-0"
            placeholder="Untitled survey"
          />
          <div className="flex items-center gap-4 text-sm shrink-0">
            {lastSaved && (
              <span className="text-xs text-neutral-400">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={exportJSON}
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Export JSON
            </button>
            <Link
              href={`/surveys/${id}/take`}
              target="_blank"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Preview
            </Link>
            <button
              onClick={save}
              disabled={saving}
              className="bg-neutral-900 text-white px-4 py-2 hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-10">
        {questions.length === 0 ? (
          <div className="border border-dashed border-neutral-200 py-16 text-center space-y-4">
            <div className="text-neutral-500 text-sm">
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
                  className="group border-l-2 border-neutral-100 hover:border-neutral-900 pl-6 py-2 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-xs uppercase tracking-wider text-neutral-400">
                      {String(i + 1).padStart(2, '0')} ·{' '}
                      {questionTypeLabels[q.type as QuestionType]}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveQuestion(i, -1)}
                        disabled={i === 0}
                        className="hover:text-neutral-900 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveQuestion(i, 1)}
                        disabled={i === questions.length - 1}
                        className="hover:text-neutral-900 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeQuestion(i)}
                        className="hover:text-neutral-900"
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
                    onChange={(branches) => updateQuestion(i, { ...q, branches })}
                  />
                </article>
              )
            })}
            <div className="pt-4 pl-6">
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
  if (questionTypeList.length === 1) {
    return (
      <button
        onClick={() => onAdd(questionTypeList[0])}
        className="text-sm border border-neutral-200 px-4 py-2 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors"
      >
        + Add question
      </button>
    )
  }
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm border border-neutral-200 px-4 py-2 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors"
      >
        + Add question
      </button>
      {open && (
        <div className="absolute mt-1 bg-white border border-neutral-200 shadow-sm z-10 min-w-[160px]">
          {questionTypeList.map((t) => (
            <button
              key={t}
              onClick={() => {
                onAdd(t)
                setOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50"
            >
              {questionTypeLabels[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}