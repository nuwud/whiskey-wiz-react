import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GameBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Current Quarter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Q1 2025</div>
          <p className="text-xs text-muted-foreground">
            January - March
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">
            Start playing to earn points
          </p>
        </CardContent>
      </Card>
    </div>
  )
}