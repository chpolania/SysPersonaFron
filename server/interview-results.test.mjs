import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import ExcelJS from 'exceljs'
import { saveInterviewResults } from './interview-results.mjs'

test('stores person role, JSON position, context, activity role and numeric answer in Excel', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'interview-results-'))
  const outputPath = path.join(directory, 'responses.xlsx')

  try {
    const allocations = [
      {
        questionId: 'Q-PROJ-02',
        functionId: 'PROJ-02',
        functionName: 'Coordinar responsables y dar seguimiento a acuerdos',
        roleId: 'ROLE-PROJ-CO',
        roleName: 'Coordinador de proyectos',
        contextId: 'CTX-02',
        contextName: 'Colaboración entre áreas',
        subprocessId: '2.3.2',
        subprocessName: 'Gestión de proyectos',
        activity: 'Coordinar entregables entre áreas',
        question: '¿Cuántos puntos asignas a esta actividad?',
        answer: 600,
        isOtherRole: true,
      },
    ]

    await Promise.all([
      saveInterviewResults({
        personRoleId: 'ROLE-OPS-AN',
        personName: 'Laura Méndez',
        personPosition: 'Analista de operaciones',
        personPreviousPosition: 'Analista de operaciones',
        allocations,
        outputPath,
      }),
      saveInterviewResults({
        personRoleId: 'ROLE-OPS-AN',
        personName: 'Laura Méndez',
        personPosition: 'Analista de operaciones',
        allocations: [{ ...allocations[0], answer: 400 }],
        outputPath,
      }),
    ])

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(outputPath)
    const worksheet = workbook.getWorksheet('Respuestas')
    assert.ok(worksheet)
    assert.deepEqual(worksheet.getRow(1).values.slice(1), [
      'recorded_at',
      'person_role_id',
      'person_name',
      'person_position',
      'person_previous_position',
      'question_id',
      'function_id',
      'function_name',
      'activity_role_id',
      'activity_role_name',
      'context_id',
      'context_name',
      'subprocess_id',
      'subprocess_name',
      'activity',
      'question',
      'answer_value',
      'is_other_role',
    ])
    assert.equal(worksheet.getRow(2).getCell(2).text, 'ROLE-OPS-AN')
    assert.equal(worksheet.getRow(2).getCell(3).text, 'Laura Méndez')
    assert.equal(
      worksheet.getRow(2).getCell(4).text,
      'Analista de operaciones',
    )
    assert.equal(
      worksheet.getRow(2).getCell(5).text,
      'Analista de operaciones',
    )
    assert.equal(worksheet.getRow(2).getCell(6).text, 'Q-PROJ-02')
    assert.equal(worksheet.getRow(2).getCell(7).text, 'PROJ-02')
    assert.equal(
      worksheet.getRow(2).getCell(16).text,
      allocations[0].question,
    )
    assert.equal(worksheet.getRow(2).getCell(9).text, 'ROLE-PROJ-CO')
    assert.equal(worksheet.getRow(2).getCell(11).text, 'CTX-02')
    assert.equal(worksheet.getRow(2).getCell(13).text, '2.3.2')
    assert.equal(worksheet.getRow(2).getCell(17).value, 600)
    assert.equal(worksheet.getRow(2).getCell(18).value, true)
    assert.equal(worksheet.rowCount, 3)
    assert.equal(worksheet.getRow(3).getCell(17).value, 400)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('preserves legacy response rows when adding the process hierarchy columns', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'interview-results-legacy-'))
  const outputPath = path.join(directory, 'responses.xlsx')

  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Respuestas')
    const legacyHeaders = [
      'recorded_at',
      'person_role_id',
      'person_name',
      'person_position',
      'question_id',
      'function_id',
      'function_name',
      'activity_role_id',
      'activity_role_name',
      'context_id',
      'context_name',
      'activity',
      'question',
      'answer_value',
      'is_other_role',
    ]
    worksheet.addRow(legacyHeaders)
    worksheet.addRow([
      '2026-10-01T10:00:00.000Z',
      'OLD-ROLE',
      'Persona histórica',
      'Cargo anterior',
      'OLD-QUESTION',
      'OLD-FUNCTION',
      'Función anterior',
      'OLD-ACTIVITY-ROLE',
      'Rol anterior',
      'OLD-CONTEXT',
      'Contexto anterior',
      'Actividad histórica',
      'Pregunta histórica',
      1000,
      false,
    ])
    await workbook.xlsx.writeFile(outputPath)

    await saveInterviewResults({
      personRoleId: '2.4',
      personName: 'Persona nueva',
      personPosition: '2.4 Abastecimiento',
      allocations: [
        {
          questionId: 'Q-2-4-1',
          functionId: '2.4.1',
          functionName: 'Función nueva',
          subprocessId: '2.4.1',
          subprocessName: 'Subproceso nuevo',
          roleId: '2.4',
          roleName: '2.4 Abastecimiento',
          contextId: '2',
          contextName: '2. Misional',
          activity: 'Actividad nueva',
          question: 'Pregunta nueva',
          answer: 1000,
          isOtherRole: false,
        },
      ],
      outputPath,
    })

    const updatedWorkbook = new ExcelJS.Workbook()
    await updatedWorkbook.xlsx.readFile(outputPath)
    const updatedSheet = updatedWorkbook.getWorksheet('Respuestas')
    assert.ok(updatedSheet)
    assert.equal(updatedSheet.rowCount, 3)
    assert.equal(updatedSheet.getRow(2).getCell(3).text, 'Persona histórica')
    assert.equal(updatedSheet.getRow(2).getCell(17).value, 1000)
    assert.equal(updatedSheet.getRow(2).getCell(13).value, '')
    assert.equal(updatedSheet.getRow(3).getCell(6).text, 'Q-2-4-1')
    assert.equal(updatedSheet.getRow(3).getCell(17).value, 1000)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
