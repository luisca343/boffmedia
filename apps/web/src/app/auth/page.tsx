import { Suspense } from "react"
import {AuthForm} from "./AuthForm"

export default function Auth() {

  return (
    <Suspense>
      <AuthForm/>
    </Suspense>
  )
}