import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, DocumentData } from 'firebase/firestore';

interface Quarter {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed';
  challenges: Array<{
    id: string;
    type: string;
    difficulty: number;
    settings: any;
  }>;
}

class QuarterService {
  private static instance: QuarterService;
  private collection = 'quarters';

  static getInstance(): QuarterService {
    if (!QuarterService.instance) {
      QuarterService.instance = new QuarterService();
    }
    return QuarterService.instance;
  }

  async getActiveQuarter(): Promise<Quarter | null> {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', '==', 'active'),
        orderBy('startDate', 'desc'),
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return this.parseQuarter(doc.data(), doc.id);
    } catch (error) {
      console.error('Error fetching active quarter:', error);
      throw error;
    }
  }

  async getQuarterById(id: string): Promise<Quarter | null> {
    try {
      const docRef = doc(db, this.collection, id);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) return null;
      return this.parseQuarter(snapshot.data(), snapshot.id);
    } catch (error) {
      console.error('Error fetching quarter:', error);
      throw error;
    }
  }

  private parseQuarter(data: DocumentData, id: string): Quarter {
    return {
      id,
      name: data.name,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      status: data.status,
      challenges: data.challenges || []
    };
  }

  // Add methods for quarter management, leaderboards, etc.
}

export const quarterService = QuarterService.getInstance();