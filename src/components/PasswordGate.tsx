import React from 'react'

/**
 * PasswordGate Component
 * Public fan portal is 100% open access for general visitors.
 * Password protection applies exclusively to Admin routes (#/admin).
 */
export default function PasswordGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
