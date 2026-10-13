export const TOTAL_POINTS = 1000

export function validatePointAnswers(questions, answers) {
  const invalidRequest = (message) => {
    const error = new Error(message)
    error.statusCode = 400
    return error
  }

  if (!Array.isArray(questions) || questions.length < 3 || questions.length > 5) {
    throw invalidRequest('La entrevista debe incluir entre 3 y 5 preguntas.')
  }
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw invalidRequest('Debes asignar puntos a todas las preguntas.')
  }

  if (
    questions.some(
      (question) =>
        !question ||
        typeof question.id !== 'string' ||
        question.id.length === 0 ||
        typeof question.question !== 'string' ||
        question.question.length < 10 ||
        question.question.length > 700,
    )
  ) {
    throw invalidRequest('Las preguntas de la entrevista no son válidas.')
  }
  const questionIds = questions.map(({ id }) => id)
  if (new Set(questionIds).size !== questions.length) {
    throw invalidRequest('Las preguntas de la entrevista no son válidas.')
  }

  const answerById = new Map(
    answers.map((answer) => [answer?.questionId, answer?.answer]),
  )
  if (
    answerById.size !== answers.length ||
    answers.some((answer) => !questionIds.includes(answer?.questionId))
  ) {
    throw invalidRequest('Cada respuesta debe corresponder a una pregunta única.')
  }

  const allocations = questions.map((question) => {
    const points = answerById.get(question.id)
    if (
      typeof points !== 'number' ||
      !Number.isInteger(points) ||
      points < 0 ||
      points > TOTAL_POINTS
    ) {
      throw invalidRequest(
        'Cada respuesta debe ser un número entero entre 0 y 1000.',
      )
    }

    return {
      questionId: question.id,
      question: question.question,
      answer: points,
      points,
    }
  })
  const totalPoints = allocations.reduce(
    (total, allocation) => total + allocation.answer,
    0,
  )

  if (totalPoints !== TOTAL_POINTS) {
    throw invalidRequest(
      `La suma de las respuestas debe ser exactamente ${TOTAL_POINTS}; el total actual es ${totalPoints}.`,
    )
  }

  return { allocations, totalPoints }
}
