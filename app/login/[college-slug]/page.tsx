"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import { Chrome, Loader2 } from "lucide-react"

type College = {
  _id: string
  name: string
  slug: string
  emailDomain: string
  colors?: {
    primary: string
    secondary: string
  }
}

export default function CollegeLoginPage({ params }: { params: Promise<{ "college-slug": string }> }) {
  const resolvedParams = use(params)
  const [college, setCollege] = useState<College | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  // Check for error in URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const errorParam = urlParams.get('error')
      if (errorParam) {
        setUrlError(decodeURIComponent(errorParam))
        // Clear the error from URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  useEffect(() => {
    const fetchCollege = async () => {
      console.log("🔍 [COLLEGE-LOGIN] Fetching college data for slug:", resolvedParams["college-slug"])
      try {
        const response = await fetch(`/api/admin/colleges?slug=${resolvedParams["college-slug"]}`)
        console.log("🔍 [COLLEGE-LOGIN] College API response status:", response.status)
        const data = await response.json()
        console.log("🔍 [COLLEGE-LOGIN] College API response data:", data)
        
        if (data.success && data.colleges.length > 0) {
          console.log("✅ [COLLEGE-LOGIN] College found:", data.colleges[0].name)
          setCollege(data.colleges[0])
        } else {
          console.log("❌ [COLLEGE-LOGIN] College not found in API response")
          // Only set "College not found" error if there's no URL error
          if (!urlError) {
            setError("College not found")
          }
        }
      } catch (err) {
        console.log("❌ [COLLEGE-LOGIN] Error fetching college:", err)
        // Only set fetch error if there's no URL error
        if (!urlError) {
          setError("Failed to load college information")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCollege()
  }, [resolvedParams["college-slug"], urlError])

  const handleGoogleSignIn = async () => {
    if (!college) {
      console.log("❌ [COLLEGE-LOGIN] No college data available for sign in")
      return
    }
    
    console.log("🔍 [COLLEGE-LOGIN] Starting Google sign in for college:", college.name)
    console.log("🔍 [COLLEGE-LOGIN] College details:", {
      slug: college.slug,
      id: college._id,
      emailDomain: college.emailDomain
    })
    
    try {
      
      // Store college context in sessionStorage for validation
      const collegeContext = {
        collegeSlug: college.slug,
        collegeId: college._id,
        emailDomain: college.emailDomain,
        collegeName: college.name
      }
      sessionStorage.setItem('collegeContext', JSON.stringify(collegeContext))
      console.log("✅ [COLLEGE-LOGIN] College context stored in sessionStorage:", collegeContext)
      
      // Start Google OAuth with custom callback
      const baseUrl = window.location.origin
      const callbackUrl = `${baseUrl}/api/auth/validate-college-email?collegeSlug=${college.slug}`
      console.log("🔍 [COLLEGE-LOGIN] Base URL:", baseUrl)
      console.log("🔍 [COLLEGE-LOGIN] Callback URL:", callbackUrl)
      
      const res = await signIn("google", { 
        redirect: false,
        callbackUrl: callbackUrl,
        state: college.slug // Pass college slug in state as backup
      })
      
      console.log("🔍 [COLLEGE-LOGIN] SignIn response:", res)
      
      if (res?.error) {
        console.log("❌ [COLLEGE-LOGIN] Google sign in error:", res.error)
        toast.error("Google login failed")
      } else if (res?.url) {
        console.log("✅ [COLLEGE-LOGIN] Redirecting to OAuth URL:", res.url)
        // Redirect to the OAuth URL
        window.location.href = res.url
      }
    } catch (error) {
      console.log("❌ [COLLEGE-LOGIN] Exception during sign in:", error)
      toast.error("Login failed. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-white px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Loading college portal...</p>
        </div>
      </div>
    )
  }

  if ((error && !urlError) || !college) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-white px-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">College Not Found</h2>
            <p className="text-gray-600">
              The college portal you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-white px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920&text=Minimal+Geometric+Pattern')] opacity-3"></div>

      <div className="relative w-full max-w-md space-y-8">
        {/* College Branding Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center p-4">
            {/* College Branding */}
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                <span className="text-black">DEVX</span>
                <span className="text-gray-500 mx-2">×</span>
                <span 
                  className="text-blue-600"
                  style={{ color: college.colors?.primary || '#1e40af' }}
                >
                  {college.name.toUpperCase()}
                </span>
              </div>
              <div className="text-lg text-gray-600">
                🎓 Recruitment Portal
              </div>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="w-full bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-black">
              Welcome to {college.name}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Join our recruitment process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              className="w-full bg-black text-white hover:bg-gray-800 transition-all duration-200 shadow-lg font-medium"
              variant="outline"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Secure Login</span>
              </div>
            </div>

            {/* Error Message */}
            {(urlError || error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 text-center">
                  <strong>Error:</strong> {urlError || error}
                </p>
              </div>
            )}

            {/* Email Domain Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 text-center">
                <strong>Note:</strong> Only @{college.emailDomain} emails are allowed to register
              </p>
            </div>

            {/* Logout Notice for Different College Users */}
            {urlError && urlError.includes("already logged in") && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 text-center mb-2">
                  <strong>Notice:</strong> {urlError}
                </p>
                <Button 
                  onClick={() => signOut({ callbackUrl: `/login/${college.slug}` })}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Logout & Switch College
                </Button>
              </div>
            )}

            <p className="text-xs text-center text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            🏛️ {college.name}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Need help? Contact your college administration
          </p>
        </div>
      </div>
    </div>
  )
}
