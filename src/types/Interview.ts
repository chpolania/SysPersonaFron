export type InterviewQuestion = {
  id: string
  question: string
}

export type InterviewAnswer = {
  questionId: string
  answer: number | ''
}

export type PointAllocation = {
  points: number
  question: string
  answer: number
  questionId: string
}
