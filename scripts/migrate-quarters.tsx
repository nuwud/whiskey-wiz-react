import { db } from '../src/config/firebase';
import { transformQuarterSamples, formatSampleData } from '../src/utils/data-transform.utils';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export const verifyQuarterData = async () => {
    const quartersRef = collection(db, 'quarters');
    const snapshot = await getDocs(quartersRef);
    const results = {
        totalQuarters: snapshot.docs.length,
        quartersWithSamples: 0,
        totalSamples: 0,
        sampleStructureValid: true,
        details: [] as string[]
    };

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.samples) {
            results.quartersWithSamples++;
            results.totalSamples += data.samples.length;
            
            // Verify each sample has required fields
            const hasInvalidSamples = data.samples.some((sample: any) => 
                !sample.id || !sample.name || typeof sample.age !== 'number' ||
                typeof sample.proof !== 'number' || !sample.mashbill
            );
            
            if (hasInvalidSamples) {
                results.sampleStructureValid = false;
                results.details.push(`Quarter ${doc.id} has invalid sample structure`);
            }
        }
    }
    return results;
};

export const migrateQuarterData = async () => {
    try {
        // Verify before migration
        console.log('Verifying current data structure...');
        const beforeState = await verifyQuarterData();
        console.log('Current state:', beforeState);

        // Perform migration
        console.log('\nPerforming migration...');
        const quartersRef = collection(db, 'quarters');
        const snapshot = await getDocs(quartersRef);
        
        let migratedCount = 0;
        const changes: string[] = [];

        for (const quarterDoc of snapshot.docs) {
            const quarterData = quarterDoc.data();

            if (!quarterData.samples) {
                console.log(`Skipping quarter ${quarterDoc.id}: No samples found`);
                continue;
            }

            // Transform old samples structure to new array format
            const samplesArray = transformQuarterSamples(quarterData.samples);
            const formattedSamples = samplesArray.map((sample, index) =>
                formatSampleData(sample, index)
            );

            // Log changes
            const changeMsg = `Quarter ${quarterDoc.id}: ${quarterData.samples.length} -> ${formattedSamples.length} samples`;
            changes.push(changeMsg);
            console.log(changeMsg);

            // Update the document
            await updateDoc(doc(quartersRef, quarterDoc.id), {
                samples: formattedSamples,
                updatedAt: new Date(),
                migratedAt: new Date(),
                dataVersion: '2.0.0'
            });

            migratedCount++;
        }

        // Verify after migration
        console.log('\nVerifying migrated data structure...');
        const afterState = await verifyQuarterData();
        console.log('Migrated state:', afterState);

        return {
            migratedCount,
            changes,
            beforeState,
            afterState
        };

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
};

// Helper function to run migration
export const runMigration = async () => {
    console.log('Starting quarter data migration...');
    try {
        await migrateQuarterData();
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

