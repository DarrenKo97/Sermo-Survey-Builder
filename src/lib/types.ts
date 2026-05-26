// Core types for the survey builder.

export type Operator = 'equals' | 'notEquals' | 'includes' | 'gt' | 'lt'

export type Branch = {
  if: { questionId: string; op: Operator; value: string | number }
  then: { goto: string } // target questionId or the string 'end'
}

export type Option = { id: string; label: string }

export type BaseQuestion = {
  id: string
  type: string
  text: string
  required: boolean
  branches?: Branch[]
}

export type SingleSelectQuestion = BaseQuestion & {
  type: 'singleSelect'
  options: Option[]
}

export type MultiSelectQuestion = BaseQuestion & {
  type: 'multiSelect'
  options: Option[]
}

export type NumericQuestion = BaseQuestion & {
  type: 'numeric'
  min?: number
  max?: number
  decimals?: number
}

export type GridQuestion = BaseQuestion & {
  type: 'grid'
  rows: Option[]
  columns: Option[]
}

export type RankingQuestion = BaseQuestion & {
  type: 'ranking'
  items: Option[]
}

export type Question =
  | SingleSelectQuestion
  | MultiSelectQuestion
  | NumericQuestion
  | GridQuestion
  | RankingQuestion

export type Survey = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  questions: Question[]
}

export type Answer = string | string[] | number | Record<string, string>
export type Answers = Record<string, Answer>