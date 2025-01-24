import { useState, useEffect } from 'react';
import { whiskeyKnowledgeService } from 'src/services/whiskey-knowledge.service';
import { WhiskeyNode } from 'src/models/whiskey-node.model';

export const useWhiskeyKnowledge = (initialNodeId?: string) => {
  const [currentNode, setCurrentNode] = useState<WhiskeyNode | null>(null);
  const [relatedNodes, setRelatedNodes] = useState<WhiskeyNode[]>([]);
  const knowledgeService = new WhiskeyKnowledgeGraphService();

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