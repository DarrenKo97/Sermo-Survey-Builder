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
    const load = async () => {
      const { data, error } = await supabase
        .from('surveys')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
      if (error) console.error(error)
      setSurveys(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

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
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-20">
      <header className="mb-16 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Sermo
            </span>
          </div>
          <h1 className="text-5xl font-serif tracking-tight">Surveys</h1>
        </div>
        <button
          onClick={createSurvey}
          className="text-sm bg-accent text-white px-5 py-2.5 hover:bg-accent-hover transition-colors"
        >
          New survey
        </button>
      </header>

      {loading ? (
        <div className="text-stone-400 text-sm">Loading…</div>
      ) : surveys.length === 0 ? (
        <div className="border border-dashed border-stone-200 py-24 text-center space-y-4">
          <div className="text-3xl font-serif text-stone-400">
            No surveys yet.
          </div>
          <div className="text-sm text-stone-500">
            Click <span className="text-stone-900">New survey</span> to begin.
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-stone-200">
          {surveys.map((s) => (
            <li key={s.id}>
              <Link
                href={`/surveys/${s.id}/edit`}
                className="flex items-center justify-between py-5 hover:bg-stone-100 -mx-3 px-3 transition-colors group"
              >
                <span className="text-base group-hover:text-accent transition-colors">
                  {s.title}
                </span>
                <span className="text-xs text-stone-400 tracking-wider">
                  {new Date(s.updated_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-32 pt-8 border-t border-stone-200 flex items-center justify-between text-xs text-stone-400 tracking-wider">
        <span>v0.1.0 · Built for physician research.</span>
        <span>
          {surveys.length} {surveys.length === 1 ? 'survey' : 'surveys'}
        </span>
      </footer>
    </main>
  )
}