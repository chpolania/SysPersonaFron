import type {
  InterviewAnswer,
  InterviewQuestion,
  PointAllocation,
} from '../types/Interview'
import type { AllowedPerson } from '../types/AllowedPerson'

type ApiError = {
  error?: string
}

async function postJson<TResponse>(
  endpoint: string,
  body: unknown,
): Promise<TResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json()) as TResponse & ApiError

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo completar la solicitud.')
  }

  return data
}

export async function generateInterviewQuestions(
  person: AllowedPerson,
  description: string,
): Promise<InterviewQuestion[]> {
  const data = await postJson<{ questions: InterviewQuestion[] }>(
    '/api/interview/questions',
    { email: person.email, description },
  )
  return data.questions
}

export async function submitInterviewAnswers(
  person: AllowedPerson,
  questions: InterviewQuestion[],
  answers: InterviewAnswer[],
): Promise<{ allocations: PointAllocation[]; totalPoints: number }> {
  return postJson('/api/interview/answers', {
    email: person.email,
    questions,
    answers,
  })
}
