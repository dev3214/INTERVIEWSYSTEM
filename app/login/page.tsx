




"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import toast from "react-hot-toast"

export default function LoginPage() {
  const handleGoogleSignIn = async () => {
    const res = await signIn("google", { redirect: true }) // allow redirect
    if (res?.error) {
      toast.error("Google login failed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Use your Google account to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleSignIn}
            className="w-full"
            variant="outline"
          >
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
