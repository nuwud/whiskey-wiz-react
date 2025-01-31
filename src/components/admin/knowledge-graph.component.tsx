import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card-ui.component';
import { whiskeyKnowledgeService, WhiskeyNode, NodeStats } from '../../services/whiskey-knowledge.service';
import { analyticsService } from '../../services/analytics.service';
import { useAuth } from '../../contexts/auth.context';

export const KnowledgeGraph: React.FC = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<WhiskeyNode[]>([]);
  const [selectedType, setSelectedType] = useState<'distillery' | 'brand' | 'style' | 'region' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<NodeStats[]>([]);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await whiskeyKnowledgeService.getCompleteGraph();
        setNodes(data.nodes);

        // Fix: Change Map key type from WhiskeyNode to string
        const typeStats = new Map<string, { count: number; totalConnections: number }>();
        data.nodes.forEach(node => {
          const current = typeStats.get(node.type) || { count: 0, totalConnections: 0 };
          typeStats.set(node.type, {
            count: current.count + 1,
            totalConnections: current.totalConnections + node.connections.length
          });
        });

        const calculatedStats: NodeStats[] = Array.from(typeStats.entries()).map(([type, data]) => ({
          type,
          count: data.count,
          avgConnections: Math.round((data.totalConnections / data.count) * 10) / 10
        }));

        setStats(calculatedStats);
        analyticsService.trackError('Knowledge graph loaded', 'knowledge_graph_component', user?.uid);
      } catch (error) {
        console.error('Failed to fetch knowledge graph:', error);
        setError('Failed to load knowledge graph. Please try again later.');
        analyticsService.trackError('Failed to load knowledge graph', 'knowledge_graph_component', user?.uid);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [user]);

  const filteredNodes = selectedType === 'all'
    ? nodes
    : nodes.filter(node => node.type === selectedType);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Graph Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map(({ type, count, avgConnections }) => (
              <div key={type} className="p-4 bg-white rounded-lg shadow">
                <h4 className="font-medium text-gray-600 uppercase text-sm">{type}</h4>
                <p className="text-2xl font-bold text-amber-600">{count}</p>
                <p className="text-sm text-gray-500">Avg. Connections: {avgConnections}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Whiskey Knowledge Graph</CardTitle>
          <div className="mt-2">
            <select title='Select node type'
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'distillery' | 'brand' | 'style' | 'region' | 'all')}
              className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            >
              <option value="all">All Types</option>
              {stats.map(({ type }) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNodes.map((node) => (
              <Card key={node.id} className="p-4 hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-lg mb-2">{node.name}</h3>
                <p className="text-sm text-gray-500 mb-2 inline-block px-2 py-1 rounded-full bg-gray-100">
                  {node.type}
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-600">Properties:</h4>
                  <ul className="list-disc pl-4">
                    {Object.entries(node.properties).map(([key, value]) => (
                      <li key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-gray-600">
                    Connections ({node.connections.length}):
                  </h4>
                  <ul className="list-disc pl-4">
                    {node.connections.map((connection: string) => (
                      <li key={connection} className="text-sm">
                        {connection}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};