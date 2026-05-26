import * as singleSelect from './singleSelect'
import * as multiSelect from './multiSelect'
import * as numeric from './numeric'
import * as grid from './grid'

export const registry = {
  singleSelect,
  multiSelect,
  numeric,
  grid,
} as const

export type QuestionType = keyof typeof registry

export const questionTypeList = Object.keys(registry) as QuestionType[]

export const questionTypeLabels: Record<QuestionType, string> = {
  singleSelect: 'Single select',
  multiSelect: 'Multi select',
  numeric: 'Number',
  grid: 'Grid',
}