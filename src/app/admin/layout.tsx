import { auth } from '@/lib/firebase'

async function checkAdmin() {
  'use server'
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  
  const token = await user.getIdTokenResult()
  if (!token.claims.admin) throw new Error('Not authorized')
  
  return user
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await checkAdmin()

  return (
    <div className="admin-area">
      <aside className="admin-nav">Admin Navigation</aside>
      <main>{children}</main>
    </div>
  )
}