import ExcelJS from 'exceljs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dataDirectory = fileURLToPath(
  new URL('../src/assets/example-data/', import.meta.url),
)

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

async function readWorkbook(filename) {
  const workbook = new ExcelJS.Workbook()
  const workbookPath = path.join(dataDirectory, filename)
  await workbook.xlsx.readFile(workbookPath)
  const worksheet = workbook.worksheets[0]

  if (!worksheet || worksheet.rowCount < 2) {
    throw new Error(`El libro ${filename} no tiene filas de datos.`)
  }

  const headers = worksheet.getRow(1).values.slice(1).map((value) => {
    if (typeof value !== 'string') {
      throw new Error(`El libro ${filename} debe incluir una fila de encabezados.`)
    }
    return value
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
}

export async function loadInterviewData() {
  const [context, roles] = await Promise.all([
    readWorkbook('contexto_entrevista.xlsx'),
    readWorkbook('funciones_por_cargo.xlsx'),
  ])

  return { context, roles }
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
