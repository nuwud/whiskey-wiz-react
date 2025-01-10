import { GameComponent } from '@/components/game/GameComponent'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">BlindBarrels.com</h1>
      </div>

      <div className="relative flex place-items-center">
        <GameComponent />
      </div>
    </main>
  )
}
