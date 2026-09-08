export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) {
    return fallback;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.request && !error.response) {
    return 'The server could not be reached. Check your connection and try again.';
  }

  if (error.message && error.message !== 'Network Error') {
    return error.message;
  }

  return fallback;
}
