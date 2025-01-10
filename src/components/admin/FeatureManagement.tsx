import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFeature } from '@/contexts/FeatureContext';

export default function FeatureManagement() {
  const { features, loading, error, toggleFeature } = useFeature();

  if (loading) return <div className="p-4">Loading features...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold mb-4">Feature Management</h1>
      {Object.entries(features).map(([id, feature]) => (
        <Card key={id} className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{feature.name}</span>
              <Switch
                checked={feature.enabled}
                onCheckedChange={(checked) => toggleFeature?.(id, checked)}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{feature.description}</p>
            {feature.requiresRefresh && (
              <p className="text-sm text-amber-600 mt-2">
                * Changes to this feature require a game refresh
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
