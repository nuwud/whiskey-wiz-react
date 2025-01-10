import { auth } from '@/lib/firebase'

async function getUser() {
  'use server'
  const session = await auth.currentUser
  if (!session) {
    throw new Error('Not authenticated')
  }
  return session
}

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  return (
    <div className="player-area">
      <aside className="player-nav">Player Navigation</aside>
      <main>{children}</main>
    </div>
  )
}