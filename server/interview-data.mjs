import ExcelJS from 'exceljs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dataDirectory = fileURLToPath(
  new URL('../src/assets/example-data/', import.meta.url),
)
const processWorkbookPath = path.join(dataDirectory, 'arbol_procesos_grupo_eterna.xlsx')
const contextWorkbookPath = path.join(dataDirectory, 'contexto_entrevista.xlsx')

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function worksheetRecords(worksheet, worksheetName) {
  if (!worksheet || worksheet.rowCount < 2) {
    throw new Error(`La hoja "${worksheetName}" no contiene filas de datos.`)
  }

  const headers = worksheet.getRow(1).values.slice(1).map((value) => {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`La hoja "${worksheetName}" debe tener encabezados válidos.`)
    }
    return value.trim()
  })

  return worksheet
    .getRows(2, worksheet.rowCount - 1)
    .filter(Boolean)
    .map((row) => {
      const record = {}
      headers.forEach((header, index) => {
        record[header] = row.getCell(index + 1).text.trim()
      })
      return record
    })
    .filter((record) => headers.some((header) => record[header]))
}

function parseLabel(value, field, allowMissingSpace = false) {
  const spacing = allowMissingSpace ? '\\s*' : '\\s+'
  const match = value.match(new RegExp(`^(\\d+(?:\\.\\d+)*)${spacing}(.+)$`))
  if (!match) {
    throw new Error(`El campo "${field}" no tiene un código jerárquico válido: "${value}".`)
  }
  return { id: match[1], name: match[2].trim() }
}

function parseMacroLabel(value) {
  const match = value.match(/^(\d+)\.\s*(.+)$/)
  if (!match) {
    throw new Error(
      `El campo "Macroproceso" no tiene un código válido: "${value}".`,
    )
  }
  return { id: match[1], name: match[2].trim() }
}

export async function loadInterviewData() {
  const processSource = new ExcelJS.Workbook()
  const contextSource = new ExcelJS.Workbook()
  await Promise.all([
    processSource.xlsx.readFile(processWorkbookPath),
    contextSource.xlsx.readFile(contextWorkbookPath),
  ])
  const detailRows = worksheetRecords(
    processSource.getWorksheet('Detalle'),
    'Detalle',
  )
  const questionRows = worksheetRecords(
    contextSource.getWorksheet('Preguntas'),
    'Preguntas',
  )
  const contexts = worksheetRecords(
    contextSource.getWorksheet('Contextos'),
    'Contextos',
  ).map(({ context_id, macroproceso }) => ({
    context_id,
    tema: macroproceso,
  }))
  const contextsById = new Map(contexts.map((context) => [context.context_id, context]))

  const processesById = new Map()
  const functions = detailRows.map((row) => {
    const macro = parseMacroLabel(row.Macroproceso)
    const process = parseLabel(row.Proceso, 'Proceso', true)
    const subprocess = parseLabel(row.Subproceso, 'Subproceso', true)
    const activity = parseLabel(row.Actividades, 'Actividades')
    const existingProcess = processesById.get(process.id)
    if (existingProcess && existingProcess.cargo !== `${process.id} ${process.name}`) {
      throw new Error(`El código de proceso "${process.id}" tiene varios nombres.`)
    }
    processesById.set(process.id, {
      role_id: process.id,
      cargo: `${process.id} ${process.name}`,
      process_name: process.name,
      macroproceso_id: macro.id,
      macroproceso: `${macro.id}. ${macro.name}`,
    })
    const context = {
      context_id: macro.id,
      tema: `${macro.id}. ${macro.name}`,
    }
    const existingContext = contextsById.get(macro.id)
    if (existingContext && existingContext.tema !== context.tema) {
      throw new Error(`El código de macroproceso "${macro.id}" tiene varios nombres.`)
    }
    if (!existingContext) {
      throw new Error(`El macroproceso "${macro.id}" no existe en la hoja Contextos.`)
    }

    return {
      role_id: process.id,
      cargo: `${process.id} ${process.name}`,
      function_id: activity.id,
      funcion_habitual: activity.name,
      activity_text: `${activity.id} ${activity.name}`,
      subprocess_id: subprocess.id,
      subproceso: `${subprocess.id} ${subprocess.name}`,
      context_id: macro.id,
      context_name: context.tema,
    }
  })

  const functionByHierarchy = new Map(
    functions.map((item) => [
      `${item.role_id}:${item.subprocess_id}:${item.function_id}`,
      item,
    ]),
  )
  const questionIds = new Set()
  const questions = questionRows.map((row) => {
    const activity = parseLabel(row.actividad, 'Preguntas.actividad')
    const key = `${row.process_id}:${row.subprocess_id}:${row.function_id}`
    const functionRow = functionByHierarchy.get(key)
    if (
      !row.question_id ||
      questionIds.has(row.question_id) ||
      !functionRow ||
      activity.id !== functionRow.function_id ||
      activity.name !== functionRow.funcion_habitual ||
      row.context_id !== functionRow.context_id ||
      row.macroproceso !== functionRow.context_name ||
      row.process_name !== functionRow.cargo ||
      row.subprocess_name !== functionRow.subproceso ||
      row.pregunta.length < 10 ||
      row.pregunta.length > 700
    ) {
      throw new Error(
        `La pregunta "${row.question_id || '(sin código)'}" no coincide con una actividad válida del libro.`,
      )
    }
    questionIds.add(row.question_id)

    return {
      id: row.question_id,
      question: row.pregunta,
      activity: functionRow.funcion_habitual,
      functionId: functionRow.function_id,
      functionName: functionRow.funcion_habitual,
      roleId: functionRow.role_id,
      roleName: functionRow.cargo,
      contextId: functionRow.context_id,
      contextName: functionRow.context_name,
      subprocessId: functionRow.subprocess_id,
      subprocessName: functionRow.subproceso,
    }
  })

  if (questions.length !== functions.length) {
    throw new Error('La hoja Preguntas debe incluir exactamente una pregunta por actividad.')
  }

  return {
    context: contexts,
    roles: [...processesById.values()],
    functions,
    questions,
  }
}

export function resolveQuestionIds(
  questionIds,
  questionBank,
  personRoleId,
  statusCode = 400,
) {
  const invalidRequest = (message) => {
    const error = new Error(message)
    error.statusCode = statusCode
    return error
  }

  if (
    !Array.isArray(questionIds) ||
    questionIds.length < 3 ||
    questionIds.length > 5 ||
    questionIds.some((id) => typeof id !== 'string' || !id.trim()) ||
    new Set(questionIds).size !== questionIds.length
  ) {
    throw invalidRequest('Debes seleccionar entre 3 y 5 preguntas únicas válidas.')
  }

  const questionsById = new Map(questionBank.map((question) => [question.id, question]))
  return questionIds.map((questionId) => {
    const question = questionsById.get(questionId)
    if (!question) {
      throw invalidRequest('La selección contiene una pregunta inexistente.')
    }
    return {
      ...question,
      personRoleId,
      isOtherRole: question.roleId !== personRoleId,
    }
  })
}

export function findRoleFunctions(roles, position) {
  const normalizedPosition = normalize(position)
  const matches = roles.filter(
    (role) => normalize(role.cargo ?? '') === normalizedPosition,
  )

  if (matches.length === 0) {
    throw new Error(
      `No hay funciones de referencia para el cargo "${position}".`,
    )
  }

  return matches
}
