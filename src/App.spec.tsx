import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('flujo de revisión de desempeño', () => {
  it('no permite continuar con un correo que no está en la lista', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'alguien@empresa-demo.example' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Este correo no está en la lista de acceso',
    )
    expect(screen.queryByLabelText('¿Qué funciones has realizado?')).not.toBeInTheDocument()
  })

  it('acepta el correo permitido sin distinguir mayúsculas y muestra el paso de funciones', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'LAURA.MENDEZ@EMPRESA-DEMO.EXAMPLE' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    expect(screen.getByText('Laura Méndez')).toBeInTheDocument()
    expect(screen.getByLabelText('¿Qué funciones has realizado?')).toBeInTheDocument()
  })

  it('solicita respuestas numéricas y no permite enviar si no suman exactamente 1000', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          questions: [
            ['Q-2-4-2-4-1-2-4-1-1', '2.4.1.1', 'Planificar el subproceso'],
            ['Q-3-7-3-7-1-3-7-1-1', '3.7.1.1', 'Ejecutar proyectos estratégicos'],
            ['Q-2-4-2-4-1-2-4-1-2', '2.4.1.2', 'Analizar requerimientos'],
          ].map(([id, functionId, activity], index) => ({
            id,
            activity,
            functionId,
            functionName: activity,
            subprocessId: `${id}-SUB`,
            subprocessName: 'Subproceso de ejemplo',
            question: `Pregunta exacta del Excel ${id}.`,
            roleId: index === 1 ? '3.7' : '2.4',
            roleName:
              index === 1 ? '3.7 Gestión de Proyectos' : '2.4 Abastecimiento',
            contextId: index === 1 ? '3' : '2',
            contextName:
              index === 1 ? '3. Apoyo' : '2. Misional',
            personRoleId: '2.4',
          })),
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocations: [100, 300, 600].map((answer, index) => {
            const isOtherRole = index === 1
            return {
              questionId: [
                'Q-2-4-2-4-1-2-4-1-1',
                'Q-3-7-3-7-1-3-7-1-1',
                'Q-2-4-2-4-1-2-4-1-2',
              ][index],
              functionId: ['2.4.1.1', '3.7.1.1', '2.4.1.2'][index],
              functionName: `Función ${index + 1}`,
              subprocessId: `SUB-${index + 1}`,
              subprocessName: `Subproceso ${index + 1}`,
              question: `Pregunta exacta del Excel ${index + 1}.`,
              activity: `Actividad de ejemplo ${index + 1}`,
              roleId: isOtherRole ? '3.7' : '2.4',
              roleName: isOtherRole
                ? '3.7 Gestión de Proyectos'
                : '2.4 Abastecimiento',
              contextId: isOtherRole ? '3' : '2',
              contextName: isOtherRole ? '3. Apoyo' : '2. Misional',
              personRoleId: '2.4',
              isOtherRole,
              answer,
              points: answer,
            }
          }),
          totalPoints: 1000,
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'laura.mendez@empresa-demo.example' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    fireEvent.change(screen.getByLabelText('¿Qué funciones has realizado?'), {
      target: {
        value: 'Coordiné operaciones, preparé reportes y apoyé proyectos.',
      },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /continuar a las preguntas/i }),
    )

    const pointInputs = await screen.findAllByRole('spinbutton')
    expect(pointInputs).toHaveLength(3)
    expect(
      screen.getByText('Posible actividad de otro rol: 3.7 Gestión de Proyectos'),
    ).toBeInTheDocument()

    const submitButton = screen.getByRole('button', {
      name: /enviar respuestas/i,
    })
    expect(submitButton).toBeDisabled()

    fireEvent.change(pointInputs[0], { target: { value: '100' } })
    fireEvent.change(pointInputs[1], { target: { value: '300' } })
    fireEvent.change(pointInputs[2], { target: { value: '500' } })
    expect(screen.getByText('900 / 1000')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    fireEvent.change(pointInputs[2], { target: { value: '600' } })
    expect(screen.getByText('1000 / 1000')).toBeInTheDocument()
    expect(submitButton).toBeEnabled()
    fireEvent.click(submitButton)

    expect(await screen.findByRole('status')).toHaveTextContent('1000')
    expect(screen.getByText('600 pts')).toBeInTheDocument()
    expect(
      screen.getByText('Posible actividad de otro rol: 3.7 Gestión de Proyectos'),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const answerRequest = fetchMock.mock.calls[1]
    const requestBody = JSON.parse(answerRequest[1].body as string) as {
      answers: { answer: number }[]
      questionIds: string[]
    }
    expect(requestBody.questionIds).toEqual([
      'Q-2-4-2-4-1-2-4-1-1',
      'Q-3-7-3-7-1-3-7-1-1',
      'Q-2-4-2-4-1-2-4-1-2',
    ])
    expect(requestBody.answers.map(({ answer }) => answer)).toEqual([
      100, 300, 600,
    ])
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Volver al inicio' }),
      ).toBeInTheDocument()
    })
  })

})
