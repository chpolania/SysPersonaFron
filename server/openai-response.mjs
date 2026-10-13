export function requireCompletionText(completion, operation) {
  const choice = completion.choices?.[0]
  const content = choice?.message?.content

  if (typeof content === 'string' && content.trim()) {
    return content
  }

  const finishReason = choice?.finish_reason ?? 'desconocido'
  const completionTokens = completion.usage?.completion_tokens
  const usageDetails =
    Number.isInteger(completionTokens)
      ? ` Se consumieron ${completionTokens} tokens de salida.`
      : ''
  const isTokenLimit = finishReason === 'length'
  const message = isTokenLimit
    ? `OpenAI agotó el límite de salida al ${operation} y no completó el JSON.${usageDetails} Aumenta el presupuesto de tokens o acorta las respuestas.`
    : choice?.message?.refusal
      ? `OpenAI rechazó la solicitud al ${operation}. Revisa que el contenido solicitado cumpla las políticas del modelo.`
      : `OpenAI terminó sin devolver texto al ${operation} (motivo: ${finishReason}). Inténtalo de nuevo.`
  const error = new Error(message)
  error.statusCode = 502
  error.finishReason = finishReason
  error.completionTokens = completionTokens
  throw error
}
