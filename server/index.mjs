import 'dotenv/config'
import express from 'express'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rateLimit } from 'express-rate-limit'
import { generateQuestions } from './interview-service.mjs'
import {
  findRoleFunctions,
  loadInterviewData,
  resolveQuestionIds,
} from './interview-data.mjs'
import { saveInterviewResults } from './interview-results.mjs'
import { validatePointAnswers } from './scoring.mjs'

const app = express()
const port = Number(process.env.PORT || 3001)
const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const buildDirectory = path.join(projectRoot, 'dist')
const allowedPeople = JSON.parse(
  readFileSync(path.join(projectRoot, 'src/assets/allowed-emails.json'), 'utf8'),
)

app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))
app.use(
  '/api/interview',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_request, response) => {
      response
        .status(429)
        .json({ error: 'Se alcanzó el límite de solicitudes. Inténtalo más tarde.' })
    },
  }),
)

function findAllowedPerson(email) {
  if (typeof email !== 'string') return null
  const normalizedEmail = email.trim().toLowerCase()
  return allowedPeople.find(
    (person) => person.email.toLowerCase() === normalizedEmail,
  ) ?? null
}

function findPersonRoleId(person, roles) {
  const matchingProcess = findRoleFunctions(roles, person.position)[0]
  if (person.processId !== matchingProcess.role_id) {
    throw new Error(
      `La correspondencia de proceso en allowed-emails.json no es válida para "${person.email}".`,
    )
  }
  return matchingProcess.role_id
}

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    openAIConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
  })
})

app.post('/api/interview/questions', async (request, response, next) => {
  try {
    const { email, description } = request.body ?? {}
    const person = findAllowedPerson(email)
    if (!person) {
      return response.status(403).json({ error: 'El correo no tiene acceso a esta entrevista.' })
    }

    const { roles, questions: questionBank } = await loadInterviewData()
    const personRoleId = findPersonRoleId(person, roles)
    const questions = await generateQuestions({
      questionBank,
      personRoleId,
      description,
      position: person.position,
    })

    return response.json({ questions })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/interview/answers', async (request, response, next) => {
  try {
    const { email, questionIds, answers } = request.body ?? {}
    const person = findAllowedPerson(email)
    if (!person) {
      return response.status(403).json({ error: 'El correo no tiene acceso a esta entrevista.' })
    }

    const { roles, questions: questionBank } = await loadInterviewData()
    const personRoleId = findPersonRoleId(person, roles)
    const canonicalQuestions = resolveQuestionIds(
      questionIds,
      questionBank,
      personRoleId,
    )
    const { allocations, totalPoints } = validatePointAnswers(
      canonicalQuestions,
      answers,
    )

    await saveInterviewResults({
      personRoleId,
      personName: person.name,
      personPosition: person.position,
      personPreviousPosition: person.previousPosition || '',
      allocations,
    })

    return response.json({
      allocations,
      totalPoints,
    })
  } catch (error) {
    return next(error)
  }
})

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Ruta de API no encontrada.' })
})

if (existsSync(buildDirectory)) {
  app.use(express.static(buildDirectory))
  app.get('*', (_request, response) => {
    response.sendFile(path.join(buildDirectory, 'index.html'))
  })
}

app.use((error, _request, response, _next) => {
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 502
  if (statusCode >= 500) {
    console.error('Error en la API de entrevista:', error)
  }
  const errorMessage =
    statusCode === 503 && error.message.includes('OPENAI_API_KEY')
      ? error.message
      : error.code === 'INTERVIEW_RESULTS_SAVE_FAILED'
        ? 'No se pudieron guardar las respuestas en el archivo Excel. Inténtalo de nuevo.'
      : 'No se pudo completar la solicitud de IA. Revisa la configuración del servidor e inténtalo de nuevo.'
  response.status(statusCode).json({
    error: statusCode >= 500 ? errorMessage : error.message,
  })
})

app.listen(port, () => {
  console.info(`API de entrevistas disponible en http://localhost:${port}`)
})
