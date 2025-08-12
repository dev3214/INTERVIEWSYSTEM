export const getBaseUrl = () => {
  // Check for environment variable first
  if (process.env.BASE_URL) {
    return process.env.BASE_URL
  }
  
  // Check for Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Check for other deployment platforms
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // Default to localhost for development
  return 'http://localhost:3000'
}

export const getLoginUrl = (collegeSlug?: string) => {
  const baseUrl = getBaseUrl()
  return collegeSlug ? `${baseUrl}/login/${collegeSlug}` : `${baseUrl}/login`
}

export const getApiUrl = (endpoint: string) => {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/api${endpoint}`
}
