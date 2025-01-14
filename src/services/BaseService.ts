import { ErrorHandler } from '../utils/errorHandler';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  DocumentData,
  Query
} from 'firebase/firestore';

export abstract class BaseService<T extends DocumentData> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected get collection() {
    return collection(db, this.collectionName);
  }

  protected async fetchDocuments(
    queryConstraints: Parameters<typeof query>['slice']['1'] = [],
    options: { 
      limit?: number; 
      orderField?: string; 
      orderDirection?: 'asc' | 'desc' 
    } = {}
  ): Promise<T[]> {
    return ErrorHandler.safeAsync(async () => {
      const { 
        limit: limitNum = 100, 
        orderField = 'createdAt', 
        orderDirection = 'desc' 
      } = options;

      const baseQuery = query(
        this.collection,
        ...queryConstraints,
        orderBy(orderField, orderDirection),
        limit(limitNum)
      );

      const snapshot = await getDocs(baseQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
    }, {
      context: `${this.collectionName}Service.fetchDocuments`,
      tags: ['database', 'query']
    }) || [];
  }
}
