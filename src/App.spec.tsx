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
          questions: [1, 2, 3].map((index) => ({
            id: `question-${index}`,
            question: `¿Cuántos puntos asignas a la actividad ${index}?`,
          })),
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocations: [100, 300, 600].map((answer, index) => ({
            questionId: `question-${index + 1}`,
            question: `¿Cuántos puntos asignas a la actividad ${index + 1}?`,
            answer,
            points: answer,
          })),
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
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const answerRequest = fetchMock.mock.calls[1]
    const requestBody = JSON.parse(answerRequest[1].body as string) as {
      answers: { answer: number }[]
    }
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
