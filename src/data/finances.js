// Dummy financial_logs based on Supabase schema
export const wallets = [
  { id: 'dana', name: 'DANA', balance: 847500, color: '#108EE9', icon: '💙', gradient: 'from-blue-500 to-blue-600' },
  { id: 'gopay', name: 'GoPay', balance: 312000, color: '#00AED6', icon: '💚', gradient: 'from-cyan-500 to-teal-500' },
  { id: 'bca', name: 'Bank BCA', balance: 4250000, color: '#003D79', icon: '🏦', gradient: 'from-blue-800 to-blue-900' },
  { id: 'tunai', name: 'Tunai', balance: 185000, color: '#64748B', icon: '💵', gradient: 'from-slate-500 to-slate-600' },
]

export const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)

export const transactions = [
  {
    id: 'txn-001',
    created_at: '2026-06-24T07:15:00+07:00',
    amount: 25000,
    category: 'Makanan',
    payment_method: 'gopay',
    description: 'Sarapan Nasi Goreng + Es Teh',
    is_impulsive: false,
    transaction_date: '2026-06-24',
    transaction_type: 'expense'
  },
  {
    id: 'txn-002',
    created_at: '2026-06-24T06:30:00+07:00',
    amount: 15000,
    category: 'Transportasi',
    payment_method: 'dana',
    description: 'Grab ke Kampus',
    is_impulsive: false,
    transaction_date: '2026-06-24',
    transaction_type: 'expense'
  },
  {
    id: 'txn-003',
    created_at: '2026-06-23T21:30:00+07:00',
    amount: 89000,
    category: 'Hiburan',
    payment_method: 'dana',
    description: 'Langganan Spotify + Netflix',
    is_impulsive: true,
    transaction_date: '2026-06-23',
    transaction_type: 'expense'
  },
  {
    id: 'txn-004',
    created_at: '2026-06-23T19:45:00+07:00',
    amount: 45000,
    category: 'Makanan',
    payment_method: 'gopay',
    description: 'Makan Malam Geprek Level 5',
    is_impulsive: true,
    transaction_date: '2026-06-23',
    transaction_type: 'expense'
  },
  {
    id: 'txn-005',
    created_at: '2026-06-23T14:00:00+07:00',
    amount: 500000,
    category: 'Freelance',
    payment_method: 'bca',
    description: 'Bayaran Project Landing Page',
    is_impulsive: false,
    transaction_date: '2026-06-23',
    transaction_type: 'income'
  },
  {
    id: 'txn-006',
    created_at: '2026-06-23T12:00:00+07:00',
    amount: 32000,
    category: 'Makanan',
    payment_method: 'tunai',
    description: 'Makan Siang Warteg',
    is_impulsive: false,
    transaction_date: '2026-06-23',
    transaction_type: 'expense'
  },
  {
    id: 'txn-007',
    created_at: '2026-06-22T20:15:00+07:00',
    amount: 150000,
    category: 'Belanja',
    payment_method: 'dana',
    description: 'Mouse Wireless Logitech',
    is_impulsive: true,
    transaction_date: '2026-06-22',
    transaction_type: 'expense'
  },
  {
    id: 'txn-008',
    created_at: '2026-06-22T16:00:00+07:00',
    amount: 1500000,
    category: 'Transfer',
    payment_method: 'bca',
    description: 'Kiriman Bulanan dari Orang Tua',
    is_impulsive: false,
    transaction_date: '2026-06-22',
    transaction_type: 'income'
  },
  {
    id: 'txn-009',
    created_at: '2026-06-22T10:00:00+07:00',
    amount: 20000,
    category: 'Transportasi',
    payment_method: 'gopay',
    description: 'Grab Pulang dari Mall',
    is_impulsive: false,
    transaction_date: '2026-06-22',
    transaction_type: 'expense'
  },
  {
    id: 'txn-010',
    created_at: '2026-06-21T22:00:00+07:00',
    amount: 55000,
    category: 'Makanan',
    payment_method: 'dana',
    description: 'Pizza HUT Personal Pan',
    is_impulsive: true,
    transaction_date: '2026-06-21',
    transaction_type: 'expense'
  },
]

export const dailyBudget = 100000
export const todaySpending = transactions
  .filter(t => t.transaction_date === '2026-06-24' && t.transaction_type === 'expense')
  .reduce((sum, t) => sum + t.amount, 0)
