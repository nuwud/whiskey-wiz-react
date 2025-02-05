import { db } from './src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs/promises';

async function backup() {
    try {
        const quartersRef = collection(db, 'quarters');
        const snapshot = await getDocs(quartersRef);
        const data = {};
        
        snapshot.forEach((doc) => {
            data[doc.id] = doc.data();
        });

        await fs.writeFile('backups/quarters_20250204_184750/quarters_backup.json', 
            JSON.stringify(data, null, 2));
            
        console.log('Backup completed successfully');
    } catch (error) {
        console.error('Backup failed:', error);
        process.exit(1);
    }
}

backup();
