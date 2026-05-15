'use client'

import { Wallet, TrendingUp, DollarSign, CreditCard, User, ArrowDownCircle, Clock, CheckCircle, XCircle, Phone, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, getDocs, addDoc } from 'firebase/firestore'
import {
  getWalletBalance as fetchRealBalance,
  getTransactions as fetchRealTransactions,
  sendPayment,
  isValidUgandaPhone,
  formatPhoneToInternational,
} from '@/lib/payment-api'

interface Subscription {
  uid: string
  email: string
  planName: string
  amount: number
  currency: string
  status: string
  startDate: any
  expiryDate: any
  isActive: boolean
}

interface UserData {
  uid: string
  email: string
  displayName?: string
  subscriptionStatus?: string
  subscriptionPlan?: string
  subscriptionExpiryDate?: any
}

export default function ManageWallet() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [userData, setUserData] = useState<Map<string, UserData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState('')
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    phone: '',
  })

  // Real backend data
  const [realBalance, setRealBalance] = useState<number | null>(null)
  const [realTransactions, setRealTransactions] = useState<any[]>([])
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)

  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonth: 0,
    activeSubscriptions: 0,
  })

  // Fetch real wallet balance
  const loadBalance = async () => {
    setBalanceLoading(true)
    try {
      const res = await fetchRealBalance()
      console.log('[v0] Wallet balance:', JSON.stringify(res))
      if (res.success) {
        setRealBalance(typeof res.balance === 'number' ? res.balance : Number(res.balance) || 0)
      }
    } catch (err) {
      console.error('[v0] Balance fetch error:', err)
    }
    setBalanceLoading(false)
  }

  // Fetch real transactions
  const loadTransactions = async () => {
    setTxLoading(true)
    try {
      const res = await fetchRealTransactions()
      console.log('[v0] Transactions:', JSON.stringify(res))
      if (res.success && Array.isArray(res.transactions)) {
        setRealTransactions(res.transactions)
      }
    } catch (err) {
      console.error('[v0] Transactions fetch error:', err)
    }
    setTxLoading(false)
  }

  useEffect(() => {
    loadBalance()
    loadTransactions()
    const balInterval = setInterval(loadBalance, 30000)
    const txInterval = setInterval(loadTransactions, 30000)
    return () => { clearInterval(balInterval); clearInterval(txInterval) }
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const usersMap = new Map<string, UserData>()
        usersSnapshot.forEach((doc) => {
          usersMap.set(doc.id, { uid: doc.id, ...doc.data() } as UserData)
        })
        setUserData(usersMap)
      } catch (err) {
        console.error('Error fetching users:', err)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'subscriptions'), orderBy('startDate', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const subsData = querySnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as Subscription[]

        setSubscriptions(subsData)

        let totalRevenue = 0
        let thisMonth = 0
        let activeCount = 0
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        subsData.forEach((sub) => {
          totalRevenue += sub.amount || 0
          const subDate = sub.startDate?.toDate?.() || new Date(sub.startDate)
          if (subDate.getMonth() === currentMonth && subDate.getFullYear() === currentYear) {
            thisMonth += sub.amount || 0
          }
          if (sub.isActive) activeCount += 1
        })

        setStats({
          totalRevenue,
          thisMonth,
          activeSubscriptions: activeCount,
        })
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching subscriptions:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawError('')
    setWithdrawSuccess('')
    setWithdrawLoading(true)

    const amount = Number.parseFloat(withdrawForm.amount)
    if (amount <= 0) {
      setWithdrawError('Please enter a valid amount')
      setWithdrawLoading(false)
      return
    }

    if (!isValidUgandaPhone(withdrawForm.phone)) {
      setWithdrawError('Please enter a valid Uganda phone number (e.g. 0771234567)')
      setWithdrawLoading(false)
      return
    }

    try {
      const formatted = formatPhoneToInternational(withdrawForm.phone)
      const result = await sendPayment(formatted, amount, 'VJ Oneflex Movies Withdrawal')
      console.log('[v0] Withdrawal result:', JSON.stringify(result))

      if (result.success) {
        setWithdrawSuccess(`Withdrawal of UGX ${amount.toLocaleString()} to ${formatted} initiated!`)
        setWithdrawForm({ amount: '', phone: '' })

        // Record in Firebase
        await addDoc(collection(db, 'withdrawals'), {
          amount,
          method: 'mobile_money',
          account: formatted,
          status: 'pending',
          reference: result.reference || null,
          created_at: new Date(),
        })

        // Refresh balance after delay
        setTimeout(loadBalance, 5000)
      } else {
        setWithdrawError(result.relworx?.message || result.message || 'Withdrawal failed.')
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error)
      setWithdrawError('Network error. Please try again.')
    }
    setWithdrawLoading(false)
  }

  const formatDate = (date: any) => {
    if (!date) return '-'
    const d = date?.toDate?.() || new Date(date)
    return d.toLocaleDateString('en-UG')
  }

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-8 h-8" />
            Wallet & Revenue
          </h1>
          <p className="text-muted-foreground">Live balance and transactions from payment provider</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadBalance(); loadTransactions() }}
            className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => { setShowWithdrawForm(!showWithdrawForm); setWithdrawError(''); setWithdrawSuccess('') }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <ArrowDownCircle className="w-5 h-5" />
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* Real Balance Card */}
      <div className="bg-card rounded-lg p-6 border-2 border-primary/30">
        <p className="text-sm text-muted-foreground mb-1">Wallet Balance (Live)</p>
        {balanceLoading ? (
          <p className="text-4xl font-bold text-foreground animate-pulse">Loading...</p>
        ) : (
          <p className="text-4xl font-bold text-foreground">{formatCurrency(realBalance ?? 0)}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          Total earned from subscriptions: {formatCurrency(stats.totalRevenue)}
        </p>
      </div>

      {/* Withdraw Form */}
      {showWithdrawForm && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Withdraw via Mobile Money</h2>
          {withdrawError && <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded"><p className="text-sm text-red-500">{withdrawError}</p></div>}
          {withdrawSuccess && <div className="mb-3 p-2 bg-green-500/20 border border-green-500/30 rounded"><p className="text-sm text-green-500">{withdrawSuccess}</p></div>}
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-foreground mb-1">
                  Amount (UGX) <span className="text-primary">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">
                  Phone Number <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="07XXXXXXXX"
                    value={withdrawForm.phone}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                {withdrawForm.phone && isValidUgandaPhone(withdrawForm.phone) && (
                  <p className="text-xs text-green-500 mt-1">{formatPhoneToInternational(withdrawForm.phone)}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={withdrawLoading}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {withdrawLoading ? 'Processing...' : 'Send Withdrawal'}
              </button>
              <button
                type="button"
                onClick={() => setShowWithdrawForm(false)}
                className="px-6 py-3 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <DollarSign className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{formatCurrency(realBalance ?? 0)}</p>
          <p className="text-sm text-muted-foreground">Wallet Balance</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <TrendingUp className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.thisMonth)}</p>
          <p className="text-sm text-muted-foreground">This Month</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <CreditCard className="w-6 h-6 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.activeSubscriptions}</p>
          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <User className="w-6 h-6 text-cyan-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{userData.size}</p>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </div>
      </div>

      {/* Real Transaction History */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Transaction History (Live)</h2>
        </div>
        {txLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        ) : realTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Phone</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Provider</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Charge</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Reference</th>
                </tr>
              </thead>
              <tbody>
                {realTransactions.map((tx: any, i: number) => {
                  const txDate = tx.completed_at || tx.created_at || tx.updated_at
                  const status = tx.request_status || tx.status || 'unknown'
                  return (
                    <tr key={tx.internal_reference || tx.customer_reference || i} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm text-muted-foreground">{txDate ? new Date(txDate).toLocaleString('en-UG') : '-'}</td>
                      <td className="p-4 text-sm text-foreground">{tx.msisdn || '-'}</td>
                      <td className="p-4 text-sm font-medium text-green-500">{formatCurrency(tx.amount || 0)}</td>
                      <td className="p-4 text-sm text-foreground">{tx.provider?.replace(/_/g, ' ') || '-'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{tx.charge ? formatCurrency(tx.charge) : '-'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                            status === 'success'
                              ? 'bg-green-500/20 text-green-500'
                              : status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {status === 'success' && <CheckCircle className="w-3 h-3" />}
                          {status === 'pending' && <Clock className="w-3 h-3" />}
                          {(status === 'failed' || status === 'cancelled') && <XCircle className="w-3 h-3" />}
                          {status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-mono">{tx.customer_reference?.slice(0, 15) || tx.internal_reference?.slice(0, 15) || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscriptions Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Subscription History</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No subscriptions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-foreground">User Email</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Plan</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Start Date</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Expiry Date</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const user = userData.get(sub.uid)
                  const isExpired = sub.expiryDate?.toDate?.()
                    ? new Date() > sub.expiryDate.toDate()
                    : false

                  return (
                    <tr key={sub.uid} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm text-foreground">{user?.email || sub.email}</td>
                      <td className="p-4 text-sm text-foreground font-medium">{sub.planName}</td>
                      <td className="p-4 text-sm font-medium text-green-500">
                        {formatCurrency(sub.amount)}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(sub.startDate)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(sub.expiryDate)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            isExpired
                              ? 'bg-red-500/20 text-red-500'
                              : sub.isActive
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-yellow-500/20 text-yellow-500'
                          }`}
                        >
                          {isExpired ? 'Expired' : sub.isActive ? 'Active' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
