import assert from 'node:assert/strict'
import test from 'node:test'
import { requireCompletionText } from './openai-response.mjs'

test('returns completed model text', () => {
  assert.equal(
    requireCompletionText(
      {
        choices: [
          {
            finish_reason: 'stop',
            message: { content: '{"questions":[]}' },
          },
        ],
      },
      'generar preguntas',
    ),
    '{"questions":[]}',
  )
})

test('reports when the output token limit truncates a response', () => {
  assert.throws(
    () =>
      requireCompletionText(
        {
          choices: [
            {
              finish_reason: 'length',
              message: { content: null },
            },
          ],
          usage: { completion_tokens: 1200 },
        },
        'generar preguntas',
      ),
    (error) => {
      assert.match(error.message, /agotó el límite de salida/)
      assert.match(error.message, /1200 tokens/)
      assert.equal(error.statusCode, 502)
      return true
    },
  )
})

test('reports model refusals without treating them as an empty JSON result', () => {
  assert.throws(
    () =>
      requireCompletionText(
        {
          choices: [
            {
              finish_reason: 'stop',
              message: { content: null, refusal: 'request refused' },
            },
          ],
        },
        'evaluar respuestas',
      ),
    /rechazó la solicitud/,
  )
})
