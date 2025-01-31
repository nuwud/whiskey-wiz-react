import { useState, useEffect } from 'react';
import { WhiskeyNode } from '../services/whiskey-knowledge.service';

export const useWhiskeyKnowledge = (initialNodeId?: string) => {
  const [currentNode, setCurrentNode] = useState<WhiskeyNode | null>(null);
  const [relatedNodes, setRelatedNodes] = useState<WhiskeyNode[]>([]);
  const knowledgeService = {
    async getNodeById(nodeId: string): Promise<WhiskeyNode> {
      // Temporary implementation
      return {
        id: nodeId,
        name: 'Sample Whiskey',
        type: 'brand',
        properties: {},
        connections: []
      };
    },

    async findRelatedNodes(nodeId: string): Promise<WhiskeyNode[]> {
      // Temporary implementation using nodeId
      return [{
        id: `related-${nodeId}`,
        name: 'Related Whiskey',
        type: 'brand',
        properties: {},
        connections: []
      }];
    }
  };

  useEffect(() => {
    const fetchNodeAndRelations = async () => {
      if (!initialNodeId) return;

      try {
        // Fetch initial node
        const node = await knowledgeService.getNodeById(initialNodeId);
        if (node) setCurrentNode(node);

        // Fetch related nodes
        const related = await knowledgeService.findRelatedNodes(initialNodeId);
        setRelatedNodes(related);
      } catch (error) {
        console.error('Failed to fetch whiskey knowledge', error);
      }
    };

    fetchNodeAndRelations();
  }, [initialNodeId]);

  const exploreNode = async (nodeId: string) => {
    try {
      const node = await knowledgeService.getNodeById(nodeId);
      if (node) {
        setCurrentNode(node);
        const related = await knowledgeService.findRelatedNodes(nodeId);
        setRelatedNodes(related);
      }
    } catch (error) {
      console.error('Failed to explore node', error);
    }
  };

  return {
    currentNode,
    relatedNodes,
    exploreNode
  };
};