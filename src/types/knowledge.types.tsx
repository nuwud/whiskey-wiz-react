export interface KnowledgeNode {
    id: string;
    name: string;
    type: 'whiskey' | 'distillery' | 'region' | 'brand' | 'style';
    properties: Record<string, any>;
    connections: string[];
}

export interface WhiskeyNode extends KnowledgeNode {
    properties: {
        age?: number;
        proof?: number;
        mashbill?: string;
        description?: string;
    };
}