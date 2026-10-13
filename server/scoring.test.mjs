import assert from 'node:assert/strict'
import test from 'node:test'
import {
  TOTAL_POINTS,
  validatePointAnswers,
} from './scoring.mjs'

const questions = [
  {
    id: 'Q-OPS-01',
    question: '¿Cuántos puntos asignas a esta actividad?',
    activity: 'Monitorear indicadores operativos',
    functionId: 'OPS-01',
    functionName: 'Monitorear indicadores operativos y documentar variaciones',
    subprocessId: 'OPS-01.1',
    subprocessName: 'Indicadores',
    roleId: 'ROLE-OPS-AN',
    roleName: 'Analista de operaciones',
    contextId: 'CTX-01',
    contextName: 'Automatización y digitalización',
    personRoleId: 'ROLE-OPS-AN',
  },
  {
    id: 'Q-PROJ-01',
    question: '¿Cuántos puntos asignas a la segunda actividad?',
    activity: 'Planificar hitos del proyecto',
    functionId: 'PROJ-01',
    functionName: 'Planificar hitos entregables y dependencias del proyecto',
    subprocessId: 'PROJ-01.1',
    subprocessName: 'Planificación',
    roleId: 'ROLE-PROJ-CO',
    roleName: 'Coordinador de proyectos',
    contextId: 'CTX-02',
    contextName: 'Colaboración entre áreas',
    personRoleId: 'ROLE-OPS-AN',
  },
  {
    id: 'Q-OPS-03',
    question: '¿Cuántos puntos asignas a la tercera actividad?',
    activity: 'Preparar reportes periódicos',
    functionId: 'OPS-03',
    functionName: 'Preparar reportes periódicos para el equipo',
    subprocessId: 'OPS-03.1',
    subprocessName: 'Reportes',
    roleId: 'ROLE-OPS-AN',
    roleName: 'Analista de operaciones',
    contextId: 'CTX-04',
    contextName: 'Análisis y toma de decisiones',
    personRoleId: 'ROLE-OPS-AN',
  },
]

test('accepts integer answers whose exact sum is 1000', () => {
  const result = validatePointAnswers(questions, [
    { questionId: 'Q-OPS-01', answer: 100 },
    { questionId: 'Q-PROJ-01', answer: 350 },
    { questionId: 'Q-OPS-03', answer: 550 },
  ])

  assert.equal(result.totalPoints, TOTAL_POINTS)
  assert.deepEqual(
    result.allocations.map(({ answer, points }) => [answer, points]),
    [[100, 100], [350, 350], [550, 550]],
  )
  assert.equal(result.allocations[1].isOtherRole, true)
  assert.equal(result.allocations[1].roleName, 'Coordinador de proyectos')
  assert.equal(result.allocations[0].isOtherRole, false)
})

test('preserves stable question/function IDs and identifies answers for another role', () => {
  const result = validatePointAnswers(questions, [
    { questionId: 'Q-OPS-01', answer: 100 },
    { questionId: 'Q-PROJ-01', answer: 350 },
    { questionId: 'Q-OPS-03', answer: 550 },
  ])

  assert.equal(result.allocations[1].questionId, 'Q-PROJ-01')
  assert.equal(result.allocations[1].functionId, 'PROJ-01')
  assert.equal(result.allocations[1].isOtherRole, true)
  assert.equal(result.allocations[1].personRoleId, 'ROLE-OPS-AN')
  assert.equal(result.allocations[0].isOtherRole, false)
})

test('rejects answers whose sum is below or above 1000', () => {
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'Q-OPS-01', answer: 100 },
        { questionId: 'Q-PROJ-01', answer: 300 },
        { questionId: 'Q-OPS-03', answer: 500 },
      ]),
    /exactamente 1000/,
  )
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'Q-OPS-01', answer: 100 },
        { questionId: 'Q-PROJ-01', answer: 400 },
        { questionId: 'Q-OPS-03', answer: 600 },
      ]),
    /exactamente 1000/,
  )
})

test('rejects non-integer and out-of-range answers', () => {
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'Q-OPS-01', answer: 100.5 },
        { questionId: 'Q-PROJ-01', answer: 300 },
        { questionId: 'Q-OPS-03', answer: 599.5 },
      ]),
    /entero entre 0 y 1000/,
  )
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'Q-OPS-01', answer: -1 },
        { questionId: 'Q-PROJ-01', answer: 400 },
        { questionId: 'Q-OPS-03', answer: 601 },
      ]),
    /entero entre 0 y 1000/,
  )
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'Q-OPS-01', answer: 1001 },
        { questionId: 'Q-PROJ-01', answer: 0 },
        { questionId: 'Q-OPS-03', answer: -1 },
      ]),
    /entero entre 0 y 1000/,
  )
})

test('rejects missing, duplicate, or unrelated answers', () => {
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'Q-OPS-01', answer: 1000 },
        { questionId: 'Q-PROJ-01', answer: 0 },
      ]),
    /todas las preguntas/,
  )
  assert.throws(
    () =>
      validatePointAnswers(questions, [
        { questionId: 'Q-OPS-01', answer: 500 },
        { questionId: 'Q-OPS-01', answer: 250 },
        { questionId: 'Q-OPS-03', answer: 250 },
      ]),
    /pregunta única/,
  )
})
