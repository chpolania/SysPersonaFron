import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_QUESTIONS_SYSTEM_PROMPT,
  getQuestionsSystemPrompt,
  selectQuestionsFromBank,
} from './interview-service.mjs'

test('uses the configured prompt from the environment', () => {
  const previousPrompt = process.env.OPENAI_QUESTIONS_SYSTEM_PROMPT
  process.env.OPENAI_QUESTIONS_SYSTEM_PROMPT = 'Prompt editable de prueba.'

  try {
    assert.equal(getQuestionsSystemPrompt(), 'Prompt editable de prueba.')
  } finally {
    if (previousPrompt === undefined) {
      delete process.env.OPENAI_QUESTIONS_SYSTEM_PROMPT
    } else {
      process.env.OPENAI_QUESTIONS_SYSTEM_PROMPT = previousPrompt
    }
  }
})

test('falls back to the built-in prompt when the environment value is empty', () => {
  const previousPrompt = process.env.OPENAI_QUESTIONS_SYSTEM_PROMPT
  process.env.OPENAI_QUESTIONS_SYSTEM_PROMPT = '  '

  try {
    assert.equal(getQuestionsSystemPrompt(), DEFAULT_QUESTIONS_SYSTEM_PROMPT)
  } finally {
    if (previousPrompt === undefined) {
      delete process.env.OPENAI_QUESTIONS_SYSTEM_PROMPT
    } else {
      process.env.OPENAI_QUESTIONS_SYSTEM_PROMPT = previousPrompt
    }
  }
})

test('returns only exact question records selected from the bank', () => {
  const bank = [
    {
      id: 'Q-OPS-01',
      question: 'Texto exacto guardado en el Excel.',
      functionId: 'OPS-01',
      functionName: 'Monitorear indicadores',
      subprocessId: 'OPS-01.1',
      subprocessName: 'Análisis operativo',
      roleId: 'ROLE-OPS-AN',
      roleName: 'Analista de operaciones',
      contextId: 'CTX-04',
      contextName: 'Análisis y toma de decisiones',
    },
    {
      id: 'Q-PROJ-02',
      question: 'Otra pregunta exacta del Excel.',
      functionId: 'PROJ-02',
      functionName: 'Coordinar responsables',
      subprocessId: 'PROJ-02.1',
      subprocessName: 'Coordinación',
      roleId: 'ROLE-PROJ-CO',
      roleName: 'Coordinador de proyectos',
      contextId: 'CTX-02',
      contextName: 'Colaboración entre áreas',
    },
    {
      id: 'Q-OPS-03',
      question: 'Tercera pregunta exacta del Excel.',
      functionId: 'OPS-03',
      functionName: 'Preparar reportes',
      subprocessId: 'OPS-03.1',
      subprocessName: 'Reportes',
      roleId: 'ROLE-OPS-AN',
      roleName: 'Analista de operaciones',
      contextId: 'CTX-04',
      contextName: 'Análisis y toma de decisiones',
    },
  ]

  const selected = selectQuestionsFromBank(
    { question_ids: ['Q-OPS-01', 'Q-PROJ-02', 'Q-OPS-03'] },
    bank,
    'ROLE-OPS-AN',
  )

  assert.equal(selected[0].question, bank[0].question)
  assert.equal(selected[1].id, 'Q-PROJ-02')
  assert.equal(selected[1].functionId, 'PROJ-02')
  assert.equal(selected[1].isOtherRole, true)
  assert.throws(
    () =>
      selectQuestionsFromBank(
        { question_ids: ['Q-OPS-01', 'Q-UNKNOWN', 'Q-OPS-03'] },
        bank,
        'ROLE-OPS-AN',
      ),
    /pregunta inexistente/,
  )
})
