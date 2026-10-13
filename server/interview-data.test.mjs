import assert from 'node:assert/strict'
import test from 'node:test'
import { findRoleFunctions, loadInterviewData } from './interview-data.mjs'

test('loads context and role functions from the example Excel workbooks', async () => {
  const { context, roles } = await loadInterviewData()
  const operationsFunctions = findRoleFunctions(roles, 'Analista de operaciones')

  assert.equal(context.length, 5)
  assert.equal(roles.length, 12)
  assert.equal(operationsFunctions.length, 4)
  assert.equal(
    findRoleFunctions(roles, 'DISEÑADORA DE PRODUCTO').length,
    4,
  )
})

test('reports when no workbook role matches the employee role', async () => {
  const { roles } = await loadInterviewData()

  assert.throws(
    () => findRoleFunctions(roles, 'Cargo sin funciones'),
    /No hay funciones de referencia/,
  )
})
