import { type FormEvent, useState } from 'react'
import allowedPeople from './assets/allowed-emails.json'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { EmailAccessPage } from './pages/EmailAccessPage'
import { FunctionsPage } from './pages/FunctionsPage'
import { QuestionsPage } from './pages/QuestionsPage'
import {
  generateInterviewQuestions,
  submitInterviewAnswers,
} from './services/interviewApi'
import type { AllowedPerson } from './types/AllowedPerson'
import type {
  InterviewAnswer,
  InterviewQuestion,
  PointAllocation,
} from './types/Interview'
import './App.css'

const people: AllowedPerson[] = allowedPeople

function App() {
  const [step, setStep] = useState<'access' | 'functions' | 'questions' | 'results'>('access')
  const [email, setEmail] = useState('')
  const [person, setPerson] = useState<AllowedPerson | null>(null)
  const [functions, setFunctions] = useState('')
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [answers, setAnswers] = useState<InterviewAnswer[]>([])
  const [allocations, setAllocations] = useState<PointAllocation[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const match = people.find(
      (entry) => entry.email.toLowerCase() === normalizedEmail,
    )

    if (!match) {
      setError(
        'Este correo no está en la lista de acceso. Verifica la dirección o contacta a Recursos Humanos.',
      )
      return
    }

    setError('')
    setPerson(match)
    setStep('functions')
  }

  const handleFunctionsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!person) return

    setError('')
    setIsSubmitting(true)
    try {
      const generatedQuestions = await generateInterviewQuestions(person, functions)
      setQuestions(generatedQuestions)
      setAnswers(
        generatedQuestions.map(({ id }) => ({ questionId: id, answer: '' })),
      )
      setStep('questions')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron generar las preguntas. Inténtalo de nuevo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: number | '') => {
    setAnswers((currentAnswers) =>
      currentAnswers.map((item) =>
        item.questionId === questionId ? { ...item, answer } : item,
      ),
    )
  }

  const handleAnswersSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!person) return
    const total = answers.reduce(
      (sum, item) => sum + (item.answer === '' ? 0 : item.answer),
      0,
    )
    if (
      answers.length !== questions.length ||
      answers.some(
        (item) =>
          item.answer === '' ||
          !Number.isInteger(item.answer) ||
          item.answer < 0 ||
          item.answer > 1000,
      ) ||
      total !== 1000
    ) {
      setError('Cada respuesta debe ser un entero de 0 a 1000 y su suma debe ser exactamente 1000.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const result = await submitInterviewAnswers(person, questions, answers)
      if (
        result.totalPoints !== 1000 ||
        result.allocations.reduce((sum, item) => sum + item.points, 0) !== 1000
      ) {
        throw new Error(
          'La respuesta del servidor no suma 1000 puntos. Inténtalo de nuevo.',
        )
      }
      setAllocations(result.allocations)
      setTotalPoints(result.totalPoints)
      setStep('results')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron guardar las respuestas. Inténtalo de nuevo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const startOver = () => {
    setPerson(null)
    setStep('access')
    setFunctions('')
    setQuestions([])
    setAnswers([])
    setAllocations([])
    setTotalPoints(0)
    setError('')
    setEmail('')
  }

  if (step === 'results' && person) {
    return (
      <ConfirmationPage
        person={person}
        allocations={allocations}
        totalPoints={totalPoints}
        onStartOver={startOver}
      />
    )
  }

  if (step === 'questions' && person) {
    return (
      <QuestionsPage
        person={person}
        questions={questions}
        answers={answers}
        isSubmitting={isSubmitting}
        error={error}
        onAnswerChange={handleAnswerChange}
        onBack={() => {
          setError('')
          setStep('functions')
        }}
        onSubmit={handleAnswersSubmit}
      />
    )
  }

  if (step === 'functions' && person) {
    return (
      <FunctionsPage
        person={person}
        value={functions}
        isSubmitting={isSubmitting}
        error={error}
        onChange={setFunctions}
        onBack={() => {
          setPerson(null)
          setError('')
          setStep('access')
        }}
        onSubmit={handleFunctionsSubmit}
      />
    )
  }

  return (
    <EmailAccessPage
      email={email}
      error={error}
      onEmailChange={(value) => {
        setEmail(value)
        if (error) setError('')
      }}
      onSubmit={handleEmailSubmit}
    />
  )
}

export default App
