import { useQuarter } from '@/contexts/quarter.context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-ui.component';

export function GameBoard() {
  const { currentQuarter } = useQuarter();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Current Quarter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentQuarter?.name || 'Loading...'}</div>
          <p className="text-xs text-muted-foreground">
            {currentQuarter ? `${new Date(currentQuarter.startDate).toLocaleDateString()} - ${new Date(currentQuarter.endDate).toLocaleDateString()}` : ''}
          </p>
        </CardContent>
      </Card>
      {/* Rest of the component */}
    </div>
  );
}