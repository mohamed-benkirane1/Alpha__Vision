export function getErrorMessage(error) {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (typeof error === 'number') return String(error)

  const responseMessage = error.response?.data?.message
  if (typeof responseMessage === 'string') return responseMessage

  const responseError = error.response?.data?.error
  if (typeof responseError === 'string') return responseError
  if (responseError?.message && typeof responseError.message === 'string') return responseError.message

  if (error.code && typeof error.message === 'string') return `${error.code}: ${error.message}`
  if (typeof error.message === 'string') return error.message
  if (typeof error.error === 'string') return error.error
  if (error.error?.message && typeof error.error.message === 'string') return error.error.message

  return 'Une erreur est survenue.'
}

export default getErrorMessage
