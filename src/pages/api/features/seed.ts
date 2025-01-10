import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/config/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { DEFAULT_FEATURES } from '@/config/features';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const featuresRef = collection(db, 'features');
    
    // Add all default features
    await Promise.all(
      DEFAULT_FEATURES.map(feature => 
        setDoc(doc(featuresRef, feature.id), feature)
      )
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error seeding features:', error);
    res.status(500).json({ error: 'Failed to seed features' });
  }
}
