import { UserNav } from './user-nav.component'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold">BlindBarrels.com</h1>
        </div>
        <UserNav />
      </div>
    </header>
  )
}