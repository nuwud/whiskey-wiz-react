"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { WhiskeyKnowledgeGraphService } from '@/services/WhiskeyKnowledgeGraphService';

interface KnowledgeNode {
  id: string;
  type: 'distillery' | 'whiskey' | 'region' | 'mashbill';
  name: string;
  connections: string[];
  properties: Record<string, any>;
}

export function KnowledgeGraph() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const graphService = new WhiskeyKnowledgeGraphService();

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await graphService.getCompleteGraph();
        setNodes(data);
      } catch (error) {
        console.error('Failed to fetch knowledge graph:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, []);

  if (loading) return <div>Loading knowledge graph...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Whiskey Knowledge Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {nodes.map((node) => (
              <Card key={node.id} className="p-4">
                <h3 className="font-bold text-lg mb-2">{node.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Type: {node.type}</p>
                <div className="space-y-2">
                  <h4 className="font-medium">Properties:</h4>
                  <ul className="list-disc pl-4">
                    {Object.entries(node.properties).map(([key, value]) => (
                      <li key={key} className="text-sm">
                        {key}: {value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium">Connections:</h4>
                  <ul className="list-disc pl-4">
                    {node.connections.map((connection) => (
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
}