import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-ui.component'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { auth } from '@/lib/firebase'

interface GameResult {
  id: string
  quarter: string
  score: number
  accuracy: number
  completedAt: Date
}

export function PlayerStats() {
  const [stats, setStats] = useState<{
    totalGames: number
    averageScore: number
    bestQuarter: string
    results: GameResult[]
  }>({
    totalGames: 0,
    averageScore: 0,
    bestQuarter: '',
    results: []
  })

  useEffect(() => {
    async function fetchStats() {
      const user = auth.currentUser
      if (!user) return

      const resultsRef = collection(db, 'gameResults')
      const q = query(resultsRef, where('userId', '==', user.uid))
      const querySnapshot = await getDocs(q)
      
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GameResult[]

      const avgScore = results.reduce((acc, game) => acc + game.score, 0) / results.length
      const bestGame = results.reduce((best, game) => 
        game.score > (best?.score || 0) ? game : best
      , results[0])

      setStats({
        totalGames: results.length,
        averageScore: avgScore,
        bestQuarter: bestGame?.quarter || '',
        results
      })
    }

    fetchStats()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalGames}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageScore.toFixed(1)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Best Quarter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.bestQuarter}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.results.slice(0, 5).map(result => (
              <div key={result.id} className="flex justify-between items-center">
                <span>{result.quarter}</span>
                <span className="text-lg font-medium">{result.score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}