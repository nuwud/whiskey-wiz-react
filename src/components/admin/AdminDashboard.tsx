"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureToggleAdmin } from './FeatureToggleAdmin';
import { AdminMetricsPanel } from './AdminMetricsPanel';
import { AdminQuarterManagement } from './AdminQuarterManagement';
import { KnowledgeGraph } from './KnowledgeGraph';
import { UserManagement } from './UserManagement';
import { useAuth } from '@/contexts/AuthContext';

export function AdminDashboard() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <div>Access Denied</div>;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="quarters">Quarter Management</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
            </TabsList>
            
            <TabsContent value="metrics">
              <AdminMetricsPanel />
            </TabsContent>
            
            <TabsContent value="quarters">
              <AdminQuarterManagement />
            </TabsContent>
            
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="features">
              <section className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Feature Management</h3>
                <FeatureToggleAdmin />
              </section>
            </TabsContent>
            
            <TabsContent value="knowledge">
              <KnowledgeGraph />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}