import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Unsubscribe' }

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <UnsubscribeResult success={false} message="Invalid unsubscribe link." />
  }

  const verified = verifyUnsubscribeToken(token)
  if (!verified) {
    return <UnsubscribeResult success={false} message="This unsubscribe link is invalid or has been tampered with." />
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', verified.subscriberId)
    .eq('newsletter_id', verified.newsletterId)

  if (error) {
    return <UnsubscribeResult success={false} message="Could not process unsubscribe. Please try again." />
  }

  return <UnsubscribeResult success={true} message="You have been unsubscribed. You won't receive any more emails from this newsletter." />
}

function UnsubscribeResult({ success, message }: { success: boolean; message: string }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="flex justify-center mb-6">
          <div className="h-6 w-6 rounded gradient-accent flex items-center justify-center">
            <span className="text-white text-[9px] font-black">NS</span>
          </div>
        </div>

        <div className={`bg-surface border rounded-xl p-8 text-center ${
          success ? 'border-success/30' : 'border-danger/30'
        }`}>
          {success
            ? <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-4" />
            : <XCircle className="h-10 w-10 text-danger mx-auto mb-4" />
          }
          <p className="text-sm font-600 text-ink mb-2">
            {success ? 'Unsubscribed' : 'Something went wrong'}
          </p>
          <p className="text-xs text-ink/50 leading-relaxed">{message}</p>
        </div>

        <p className="text-center text-xs text-ink/25 mt-4">
          Newsletter Studio · Ezra Studio
        </p>
      </div>
    </div>
  )
}
