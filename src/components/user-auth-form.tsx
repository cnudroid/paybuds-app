'use client'

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icons } from "./icons"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false)
  const searchParams = useSearchParams()

  const loginWithGoogle = async () => {
    setIsGoogleLoading(true)

    try {
      await signIn("google", {
        callbackUrl: searchParams?.get("from") || "/dashboard",
      })
    } catch (error) {
      // Handle error: maybe show a toast notification
      console.error(error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Button
        variant="outline"
        type="button"
        onClick={loginWithGoogle}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
    </div>
  )
}
