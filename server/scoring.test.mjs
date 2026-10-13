import assert from 'node:assert/strict'
import test from 'node:test'
import { TOTAL_POINTS, validatePointAnswers } from './scoring.mjs'

const questions = [
  { id: 'q1', question: '¿Cuántos puntos asignas a esta actividad?' },
  { id: 'q2', question: '¿Cuántos puntos asignas a la segunda actividad?' },
  { id: 'q3', question: '¿Cuántos puntos asignas a la tercera actividad?' },
]

test('accepts integer answers whose exact sum is 1000', () => {
  const result = validatePointAnswers(questions, [
    { questionId: 'q1', answer: 100 },
    { questionId: 'q2', answer: 350 },
    { questionId: 'q3', answer: 550 },
  ])

  assert.equal(result.totalPoints, TOTAL_POINTS)
  assert.deepEqual(
    result.allocations.map(({ answer, points }) => [answer, points]),
    [[100, 100], [350, 350], [550, 550]],
  )
})

test('rejects answers whose sum is below or above 1000', () => {
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'q1', answer: 100 },
        { questionId: 'q2', answer: 300 },
        { questionId: 'q3', answer: 500 },
      ]),
    /exactamente 1000/,
  )
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'q1', answer: 100 },
        { questionId: 'q2', answer: 400 },
        { questionId: 'q3', answer: 600 },
      ]),
    /exactamente 1000/,
  )
})

test('rejects non-integer and out-of-range answers', () => {
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'q1', answer: 100.5 },
        { questionId: 'q2', answer: 300 },
        { questionId: 'q3', answer: 599.5 },
      ]),
    /entero entre 0 y 1000/,
  )
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'q1', answer: -1 },
        { questionId: 'q2', answer: 400 },
        { questionId: 'q3', answer: 601 },
      ]),
    /entero entre 0 y 1000/,
  )
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'q1', answer: 1001 },
        { questionId: 'q2', answer: 0 },
        { questionId: 'q3', answer: -1 },
      ]),
    /entero entre 0 y 1000/,
  )
})

test('rejects missing, duplicate, or unrelated answers', () => {
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'q1', answer: 1000 },
        { questionId: 'q2', answer: 0 },
      ]),
    /todas las preguntas/,
  )
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'q1', answer: 500 },
        { questionId: 'q1', answer: 250 },
        { questionId: 'q3', answer: 250 },
      ]),
    /pregunta única/,
  )
})
