import ExcelJS from 'exceljs'
import { access, mkdir, rename } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const resultsFilePath = fileURLToPath(
  new URL('./data/interview-responses.xlsx', import.meta.url),
)
const columns = [
  { header: 'recorded_at', key: 'recordedAt', width: 26 },
  { header: 'person_role_id', key: 'personRoleId', width: 18 },
  { header: 'person_name', key: 'personName', width: 28 },
  { header: 'person_position', key: 'personPosition', width: 32 },
  {
    header: 'person_previous_position',
    key: 'personPreviousPosition',
    width: 32,
  },
  { header: 'question_id', key: 'questionId', width: 18 },
  { header: 'function_id', key: 'functionId', width: 16 },
  { header: 'function_name', key: 'functionName', width: 48 },
  { header: 'activity_role_id', key: 'roleId', width: 18 },
  { header: 'activity_role_name', key: 'roleName', width: 28 },
  { header: 'context_id', key: 'contextId', width: 14 },
  { header: 'context_name', key: 'contextName', width: 30 },
  { header: 'subprocess_id', key: 'subprocessId', width: 18 },
  { header: 'subprocess_name', key: 'subprocessName', width: 50 },
  { header: 'activity', key: 'activity', width: 50 },
  { header: 'question', key: 'question', width: 70 },
  { header: 'answer_value', key: 'answer', width: 16 },
  { header: 'is_other_role', key: 'isOtherRole', width: 16 },
]

let writeQueue = Promise.resolve()

async function appendRows(rows, outputPath) {
  const workbook = new ExcelJS.Workbook()
  let worksheet
  let fileExists = true

  try {
    await access(outputPath)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    fileExists = false
  }

  if (fileExists) {
    await workbook.xlsx.readFile(outputPath)
    worksheet = workbook.getWorksheet('Respuestas')
    if (!worksheet) {
      throw new Error(`El libro de respuestas no tiene la hoja Respuestas: ${outputPath}`)
    }
    const existingHeaders = worksheet.getRow(1).values.slice(1)
    const existingHeaderSet = new Set(existingHeaders)
    const currentHeaderSet = new Set(columns.map(({ header }) => header))
    if (
      existingHeaders.some((header) => !currentHeaderSet.has(header)) ||
      [...currentHeaderSet].some(
        (header) =>
          !existingHeaderSet.has(header) &&
          ![
            'person_previous_position',
            'subprocess_id',
            'subprocess_name',
          ].includes(header),
      )
    ) {
      throw new Error(`El formato del libro de respuestas no coincide: ${outputPath}`)
    }

    if (
      existingHeaders.length !== columns.length ||
      columns.some((column, index) => existingHeaders[index] !== column.header)
    ) {
      const existingRows =
        worksheet.rowCount > 1
          ? worksheet
              .getRows(2, worksheet.rowCount - 1)
              .map((row) =>
                Object.fromEntries(
                  existingHeaders.map((header, index) => [
                    header,
                    row.getCell(index + 1).value,
                  ]),
                ),
              )
          : []
      workbook.removeWorksheet(worksheet.id)
      worksheet = workbook.addWorksheet('Respuestas')
      worksheet.columns = columns
      worksheet.views = [{ state: 'frozen', ySplit: 1 }]
      worksheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + columns.length)}1`,
      }
      existingRows.forEach((row) =>
        worksheet.addRow(
          columns.map(({ header }) =>
            header in row ? row[header] : '',
          ),
        ),
      )
    }
  } else {
    worksheet = workbook.addWorksheet('Respuestas')
    worksheet.columns = columns
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(64 + columns.length)}1`,
    }
  }

  rows.forEach((row) =>
    worksheet.addRow(columns.map(({ key }) => row[key])),
  )

  const temporaryPath = `${outputPath}.${randomUUID()}.tmp`
  try {
    await workbook.xlsx.writeFile(temporaryPath)
    await rename(temporaryPath, outputPath)
  } catch (error) {
    throw new Error(`No se pudo guardar el libro de respuestas: ${outputPath}`, {
      cause: error,
    })
  }
}

export function saveInterviewResults({
  personRoleId,
  personName,
  personPosition,
  personPreviousPosition,
  allocations,
  outputPath = resultsFilePath,
}) {
  const rows = allocations.map((allocation) => ({
    recordedAt: new Date().toISOString(),
    personRoleId,
    personName,
    personPosition,
    personPreviousPosition,
    questionId: allocation.questionId,
    functionId: allocation.functionId,
    functionName: allocation.functionName,
    roleId: allocation.roleId,
    roleName: allocation.roleName,
    contextId: allocation.contextId,
    contextName: allocation.contextName,
    subprocessId: allocation.subprocessId,
    subprocessName: allocation.subprocessName,
    activity: allocation.activity,
    question: allocation.question,
    answer: allocation.answer,
    isOtherRole: allocation.isOtherRole,
  }))

  const operation = writeQueue.then(async () => {
    try {
      await mkdir(path.dirname(outputPath), { recursive: true })
      await appendRows(rows, outputPath)
    } catch (cause) {
      const error = new Error('No se pudo guardar el archivo de respuestas.', {
        cause,
      })
      error.statusCode = 500
      error.code = 'INTERVIEW_RESULTS_SAVE_FAILED'
      throw error
    }
  })
  writeQueue = operation.catch(() => {})
  return operation
}
