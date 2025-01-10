import { FeatureToggleAdmin } from './FeatureToggleAdmin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8">
            <section>
              <h3 className="text-lg font-medium mb-4">Feature Management</h3>
              <FeatureToggleAdmin />
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}