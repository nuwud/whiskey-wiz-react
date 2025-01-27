import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-ui.component'
import { useFeatures } from '@/contexts/feature.context'

interface FeatureFlags {
  'advanced-stats': boolean;
}

export function PlayerDashboard() {
  const { features } = useFeatures()
  const showStats = features?.['advanced-stats']

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8">
            {showStats && (
              <section>
                <h3 className="text-lg font-medium mb-4">Your Stats</h3>
                {/* Stats components will go here */}
              </section>
            )}
            <section>
              <h3 className="text-lg font-medium mb-4">Recent Games</h3>
              {/* Recent games list will go here */}
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}