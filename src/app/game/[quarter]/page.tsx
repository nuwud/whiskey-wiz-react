import { GameBoard } from '@/components/game/GameBoard'
import { headers } from 'next/headers'

export default function QuarterGame({ params }: { params: { quarter: string } }) {
  // Can be embedded in Shopify or accessed directly
  const headersList = headers()
  const isEmbedded = headersList.get('referer')?.includes('blindbarrels.com') || false

  return (
    <div className={isEmbedded ? 'embedded' : 'standalone'}>
      <GameBoard quarter={params.quarter} />
    </div>
  )
}