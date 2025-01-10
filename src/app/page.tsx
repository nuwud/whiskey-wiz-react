import { GameBoard } from '@/components/game/GameBoard'
import { Header } from '@/components/common/Header'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <GameBoard />
      </div>
    </main>
  )
}
