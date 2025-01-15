import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AnalyticsService } from './AnalyticsService';

// Advanced knowledge representation
export interface WhiskeyNode {
  id: string;
  type: 'distillery' | 'region' | 'whiskey' | 'flavor' | 'production_method';
  name: string;
  description: string;
  metadata: Record<string, any>;
}

export interface WhiskeyEdge {
  sourceId: string;
  targetId: string;
  relationType: 'produces' | 'influences' | 'similar_to' | 'derived_from';
  weight: number;
}

export interface KnowledgeExplorationResult {
  startNode: WhiskeyNode;
  endNode: WhiskeyNode;
  path: WhiskeyNode[];
  connections: WhiskeyEdge[];
  complexity: number;
}

export class WhiskeyKnowledgeGraphService {
  private nodesCollection = collection(db, 'whiskey_knowledge_nodes');
  private edgesCollection = collection(db, 'whiskey_knowledge_edges');

  async getNodeById(nodeId: string): Promise<WhiskeyNode | null> {
    try {
      const nodeRef = doc(this.nodesCollection, nodeId);
      const nodeDoc = await getDoc(nodeRef);
      
      return nodeDoc.exists() 
        ? { id: nodeDoc.id, ...nodeDoc.data() } as WhiskeyNode 
        : null;
    } catch (error) {
      console.error('Failed to fetch node', error);
      return null;
    }
  }

  async createNode(node: Omit<WhiskeyNode, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.nodesCollection, node);
      
      AnalyticsService.trackUserEngagement('knowledge_node_created', {
        nodeType: node.type,
        nodeName: node.name
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to create knowledge node', error);
      throw error;
    }
  }

  async findRelatedNodes(nodeId: string, depth: number = 2): Promise<WhiskeyNode[]> {
    try {
      const relatedEdgesQuery = query(
        this.edgesCollection,
        where('sourceId', '==', nodeId)
      );

      const edgesSnapshot = await getDocs(relatedEdgesQuery);
      const relatedNodeIds = edgesSnapshot.docs
        .map(doc => doc.data() as WhiskeyEdge)
        .map(edge => edge.targetId);

      const relatedNodesPromises = relatedNodeIds.map(async (relatedId) => {
        const nodeRef = doc(this.nodesCollection, relatedId);
        const nodeDoc = await getDoc(nodeRef);
        return nodeDoc.exists() ? { id: nodeDoc.id, ...nodeDoc.data() } as WhiskeyNode : null;
      });

      const relatedNodes = (await Promise.all(relatedNodesPromises)).filter(node => node !== null);

      return relatedNodes;
    } catch (error) {
      console.error('Failed to find related nodes', error);
      return [];
    }
  }
}