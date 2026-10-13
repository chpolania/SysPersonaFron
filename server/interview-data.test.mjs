import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { findRoleFunctions, loadInterviewData } from './interview-data.mjs'

const allowedPeoplePath = fileURLToPath(
  new URL('../src/assets/allowed-emails.json', import.meta.url),
)

test('loads context and role functions from the example Excel workbooks', async () => {
  const { context, roles, functions, questions } = await loadInterviewData()
  const procurementFunctions = findRoleFunctions(roles, '2.4 Abastecimiento')

  assert.equal(context.length, 4)
  assert.equal(roles.length, 21)
  assert.equal(functions.length, 895)
  assert.equal(questions.length, functions.length)
  assert.equal(procurementFunctions[0].role_id, '2.4')
  assert.ok(
    questions.every((question) =>
      functions.some(
        (roleFunction) =>
          roleFunction.role_id === question.roleId &&
          roleFunction.function_id === question.functionId &&
          roleFunction.cargo === question.roleName,
      ),
    ),
  )
  assert.equal(new Set(questions.map(({ id }) => id)).size, questions.length)
  assert.equal(
    findRoleFunctions(roles, '3.6 Gestión de TI').length,
    1,
  )
})

test('resolves exact workbook question text and linked role/function/context by stable ID', async () => {
  const { questions } = await loadInterviewData()
  const selected = questions.find(
    ({ roleId, functionId }) => roleId === '2.3' && functionId === '2.3.2.1',
  )

  assert.ok(selected)
  assert.match(selected.id, /^Q-2-3-/)
  assert.equal(selected.roleId, '2.3')
  assert.equal(selected.contextId, '2')
  assert.ok(selected.subprocessId.startsWith('2.3.'))
  assert.ok(selected.question.includes(selected.functionName))
})

test('reports when no workbook role matches the employee role', async () => {
  const { roles } = await loadInterviewData()

  assert.throws(
    () => findRoleFunctions(roles, 'Cargo sin funciones'),
    /No hay funciones de referencia/,
  )
})

test('every allowed person maps to one unique process role in the imported tree', async () => {
  const [{ roles }, allowedPeopleJson] = await Promise.all([
    loadInterviewData(),
    readFile(allowedPeoplePath, 'utf8'),
  ])
  const people = JSON.parse(allowedPeopleJson)
  const mappedProcessIds = people.map((person) => {
    const matchingRole = roles.find((role) => role.cargo === person.position)
    assert.ok(matchingRole, `No existe el proceso para ${person.name}.`)
    assert.equal(person.processId, matchingRole.role_id)
    return matchingRole.role_id
  })

  assert.equal(people.length, roles.length)
  assert.equal(new Set(mappedProcessIds).size, roles.length)
  assert.equal(people.filter((person) => person.previousPosition !== 'Perfil de prueba').length, 4)
})
