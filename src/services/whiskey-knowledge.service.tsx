import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AnalyticsService } from './analytics.service';

export interface WhiskeyNode {
  id: string;
  type: 'distillery' | 'brand' | 'style' | 'region';
  name: string;
  description?: string;
  properties: Record<string, any>;
  connections: Array<'produces' | 'belongs_to' | 'located_in' | 'influences' | 'related_to' | 'similar_to' | 'contains'>;
  // Add more properties as needed
}

export interface WhiskeyRelation {
  source: string;
  target: string;
  type: 'produces' | 'belongs_to' | 'located_in' | 'influences';
  properties: Record<string, any>;
}

export interface WhiskeyGraph {
  nodes: WhiskeyNode[];
  relations: WhiskeyRelation[];
}

class WhiskeyKnowledgeGraphService {
  nodesCollection = collection(db, 'whiskey_nodes');
  relationsCollection = collection(db, 'whiskey_relations');

  async getCompleteGraph(): Promise<{ nodes: WhiskeyNode[]; relations: WhiskeyRelation[]; }> {
    try {
      const [nodes, relations] = await Promise.all([
        this.getAllNodes(),
        this.getAllRelations()
      ]);

      // Add connections to nodes
      const nodesWithConnections = nodes.map(node => ({
        ...node,
        connections: relations
          .filter(r => r.source === node.id)
          .map(r => r.target as 'produces' | 'belongs_to' | 'located_in' | 'influences' | 'related_to' | 'similar_to' | 'contains')
      }));

      return { nodes: nodesWithConnections, relations };
    } catch (error) {
      console.error('Failed to fetch complete whiskey knowledge graph', error);
      AnalyticsService.trackError('Failed to fetch knowledge graph', 'whiskey_knowledge_service');
      return { nodes: [], relations: [] };
    }
  }

  async getNodeById(nodeId: string): Promise<WhiskeyNode | null> {
    try {
      const nodeDoc = await getDoc(doc(this.nodesCollection, nodeId));
      if (!nodeDoc.exists()) return null;

      return {
        id: nodeDoc.id,
        ...nodeDoc.data()
      } as WhiskeyNode;
    } catch (error) {
      console.error('Failed to fetch whiskey node', error);
      AnalyticsService.trackError('Failed to fetch whiskey node', 'whiskey_knowledge_service');
      return null;
    }
  }

  async getRelatedNodes(nodeId: string): Promise<WhiskeyNode[]> {
    try {
      const relationsQuery = query(
        this.relationsCollection,
        where('source', '==', nodeId)
      );

      const relationsSnapshot = await getDocs(relationsQuery);
      const targetIds = relationsSnapshot.docs.map(doc => doc.data().target);

      const nodes = await Promise.all(
        targetIds.map(id => this.getNodeById(id))
      );

      return nodes.filter((node): node is WhiskeyNode => node !== null);
    } catch (error) {
      console.error('Failed to fetch related whiskey nodes', error);
      AnalyticsService.trackError('Failed to fetch related nodes', 'whiskey_knowledge_service');
      return [];
    }
  }

  async searchNodes(query: string): Promise<WhiskeyNode[]> {
    try {
      const snapshot = await getDocs(this.nodesCollection);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as WhiskeyNode))
        .filter(node =>
          node.name.toLowerCase().includes(query.toLowerCase()) ||
          node.description?.toLowerCase().includes(query.toLowerCase())
        );
    } catch (error) {
      console.error('Failed to search whiskey nodes', error);
      AnalyticsService.trackError('Failed to search nodes', 'whiskey_knowledge_service');
      return [];
    }
  }

  private async getAllNodes(): Promise<WhiskeyNode[]> {
    try {
      const snapshot = await getDocs(this.nodesCollection);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WhiskeyNode));
    } catch (error) {
      console.error('Failed to fetch all whiskey nodes', error);
      AnalyticsService.trackError('Failed to fetch all nodes', 'whiskey_knowledge_service');
      return [];
    }
  }

  private async getAllRelations(): Promise<WhiskeyRelation[]> {
    try {
      const snapshot = await getDocs(this.relationsCollection);
      return snapshot.docs.map(doc => ({
        ...doc.data()
      } as WhiskeyRelation));
    } catch (error) {
      console.error('Failed to fetch all whiskey relations', error);
      AnalyticsService.trackError('Failed to fetch all relations', 'whiskey_knowledge_service');
      return [];
    }
  }

  async getNodesByType(type: WhiskeyNode['type']): Promise<WhiskeyNode[]> {
    try {
      const q = query(this.nodesCollection, where('type', '==', type));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WhiskeyNode));
    } catch (error) {
      console.error('Failed to fetch whiskey nodes by type', error);
      AnalyticsService.trackError('Failed to fetch nodes by type', 'whiskey_knowledge_service');
      return [];
    }
  }

  async getRelationsByType(type: WhiskeyRelation['type']): Promise<WhiskeyRelation[]> {
    try {
      const q = query(this.relationsCollection, where('type', '==', type));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data()
      } as WhiskeyRelation));
    } catch (error) {
      console.error('Failed to fetch whiskey relations by type', error);
      AnalyticsService.trackError('Failed to fetch relations by type', 'whiskey_knowledge_service');
      return [];
    }
  }
}

export class KnowledgeNode {
  constructor(public node: WhiskeyNode) {
    if (!this.node) throw new Error('Invalid node');
    if (this.node.type === undefined) throw new Error('Invalid node type');
    if (this.node.connections === undefined) throw new Error('Invalid connections');
    if (this.node.name === undefined) throw new Error('Invalid node name');
  }
  get connections(): string[] {
    return this.node.connections;
  }
}

export const whiskeyKnowledgeService = new WhiskeyKnowledgeGraphService();
