'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type SurveyRow = {
  id: string
  title: string
  updated_at: string
}

export default function Home() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadSurveys()
  }, [])

  async function loadSurveys() {
    const { data, error } = await supabase
      .from('surveys')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
    if (error) console.error(error)
    setSurveys(data ?? [])
    setLoading(false)
  }

  async function createSurvey() {
    const { data, error } = await supabase
      .from('surveys')
      .insert({ title: 'Untitled survey', data: { questions: [] } })
      .select()
      .single()
    if (error || !data) {
      console.error(error)
      return
    }
    router.push(`/surveys/${data.id}/edit`)
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-400 mb-1">
            Sermo
          </div>
          <h1 className="text-3xl font-medium tracking-tight">Surveys</h1>
        </div>
        <button
          onClick={createSurvey}
          className="text-sm bg-neutral-900 text-white px-4 py-2 hover:bg-neutral-700 transition-colors"
        >
          New survey
        </button>
      </header>

      {loading ? (
        <div className="text-neutral-400 text-sm">Loading…</div>
      ) : surveys.length === 0 ? (
        <div className="text-neutral-500 text-sm py-16 text-center border border-dashed border-neutral-200">
          No surveys yet. Click <span className="text-neutral-900">New survey</span> to begin.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {surveys.map((s) => (
            <li key={s.id}>
              <Link
                href={`/surveys/${s.id}/edit`}
                className="flex items-center justify-between py-4 hover:bg-neutral-50 -mx-3 px-3 transition-colors"
              >
                <span className="text-base">{s.title}</span>
                <span className="text-xs text-neutral-400">
                  {new Date(s.updated_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}