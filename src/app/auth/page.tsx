'use client'

import { useSearchParams } from 'next/navigation'
import AuthForm from "./AuthForm"

export default function Auth() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')

  return (
    <AuthForm isRegister={mode === 'register'} />
  )
}