const API_BASE = 'https://vjpilesug.okotstephen57.workers.dev'

/**
 * Convert a local Uganda phone number (07..., 03..., etc.) to +256 format.
 * If already in +256 format, return as-is.
 */
export function formatPhoneToInternational(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '')
  if (cleaned.startsWith('+256')) return cleaned
  if (cleaned.startsWith('256')) return `+${cleaned}`
  if (cleaned.startsWith('0')) return `+256${cleaned.slice(1)}`
  return `+256${cleaned}`
}

/**
 * Validate a Uganda phone number (must be 07xx, 03xx, etc. - 10 digits starting with 0,
 * or +256 followed by 9 digits)
 */
export function isValidUgandaPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '')
  // +256XXXXXXXXX (13 chars)
  if (/^\+256[0-9]{9}$/.test(cleaned)) return true
  // 256XXXXXXXXX (12 chars)
  if (/^256[0-9]{9}$/.test(cleaned)) return true
  // 0XXXXXXXXX (10 chars)
  if (/^0[0-9]{9}$/.test(cleaned)) return true
  return false
}

export interface RequestPaymentResponse {
  success: boolean
  reference?: string
  relworx?: {
    success?: boolean
    internal_reference?: string
    customer_reference?: string
    msisdn?: string
    amount?: number
    currency?: string
    provider?: string
    request_status?: string
    message?: string
  }
  message?: string
}

export interface RequestStatusResponse {
  success: boolean
  internal_reference?: string
  relworx?: {
    success?: boolean
    status?: string
    message?: string
    customer_reference?: string
    internal_reference?: string
    msisdn?: string
    amount?: number
    currency?: string
    provider?: string
    charge?: number
    request_status?: string
    remote_ip?: string
    provider_transaction_id?: string
    completed_at?: string
  }
  message?: string
}

export interface WalletBalanceResponse {
  success: boolean
  balance: number
  relworx?: any
}

export interface TransactionsResponse {
  success: boolean
  transactions: any[]
  relworx?: any
}

/**
 * Request a mobile money payment (deposit) from user
 */
export async function requestPayment(
  msisdn: string,
  amount: number,
  description?: string
): Promise<RequestPaymentResponse> {
  const res = await fetch(`${API_BASE}/api/request-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msisdn: formatPhoneToInternational(msisdn),
      amount,
      description: description || 'VJ Oneflex Movies Subscription',
    }),
  })
  return res.json()
}

/**
 * Check the status of a payment request
 */
export async function checkRequestStatus(
  internalReference: string
): Promise<RequestStatusResponse> {
  const res = await fetch(
    `${API_BASE}/api/request-status?internal_reference=${encodeURIComponent(internalReference)}`
  )
  return res.json()
}

/**
 * Get wallet balance from the backend
 */
export async function getWalletBalance(): Promise<WalletBalanceResponse> {
  const res = await fetch(`${API_BASE}/api/wallet/balance`)
  return res.json()
}

/**
 * Get transaction history from the backend
 */
export async function getTransactions(): Promise<TransactionsResponse> {
  const res = await fetch(`${API_BASE}/api/transactions`)
  return res.json()
}

/**
 * Send payment (withdraw) via backend
 */
export async function sendPayment(
  msisdn: string,
  amount: number,
  description?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/send-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msisdn: formatPhoneToInternational(msisdn),
      amount,
      description: description || 'VJ Oneflex Movies Withdrawal',
    }),
  })
  return res.json()
}
