import { Suspense } from 'react'
import { ResetPasswordForm } from './reset-password-form'

function ResetPasswordSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-line p-8 shadow-card">
      <div className="h-6 w-36 bg-line rounded animate-pulse mb-2" />
      <div className="h-4 w-52 bg-line/60 rounded animate-pulse mb-7" />
      <div className="space-y-4">
        <div className="h-10 bg-line/40 rounded animate-pulse" />
        <div className="h-10 bg-line/40 rounded animate-pulse" />
        <div className="h-10 bg-cyan/20 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
