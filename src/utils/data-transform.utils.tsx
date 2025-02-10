import { WhiskeySample, SampleId, MASHBILL_TYPES } from '../types/game.types';

const EXPECTED_SAMPLE_IDS: SampleId[] = ['A', 'B', 'C', 'D'];

const DEFAULT_WHISKEY_SAMPLE: Omit<WhiskeySample, 'id'> = {
    name: '',
    age: 0,
    proof: 0,
    mashbill: MASHBILL_TYPES.BOURBON,
    hints: [],
    distillery: '',
    description: '',
    notes: [],
    difficulty: 'beginner',
    score: 'score A',
    challengeQuestions: [],
    image: '',
    rating: 0,
    type: '',
    region: '',
    imageUrl: '',
    price: 0
};

export const transformQuarterSamples = (samples: any): Record<SampleId, WhiskeySample> => {
    console.log('Transforming samples:', samples);
    
    let transformedSamples: Record<SampleId, WhiskeySample> = EXPECTED_SAMPLE_IDS.reduce((acc, id) => ({
        ...acc,
        [id]: { ...DEFAULT_WHISKEY_SAMPLE, id, name: `Sample ${id}` }
    }), {} as Record<SampleId, WhiskeySample>);

    try {
        if (Array.isArray(samples)) {
            // Handle array input
            if (samples.length < 4) {
                console.warn(`Not enough samples: ${samples.length}. Adding default samples.`);
                while (samples.length < 4) {
                    samples.push({ ...DEFAULT_WHISKEY_SAMPLE });
                }
            }

            samples = samples.slice(0, 4);
            interface SampleAccumulator extends Record<SampleId, WhiskeySample> {}
            interface SampleInput extends Partial<WhiskeySample> {}

            transformedSamples = samples.reduce((acc: SampleAccumulator, sample: SampleInput, index: number) => {
                const sampleId: SampleId = EXPECTED_SAMPLE_IDS[index];
                return {
                    ...acc,
                    [sampleId]: {
                        ...DEFAULT_WHISKEY_SAMPLE,
                        ...sample,
                        id: sampleId,
                        name: sample.name || `Sample ${sampleId}`
                    }
                };
            }, {} as SampleAccumulator);
        } else if (typeof samples === 'object' && samples !== null) {
            // Handle object input
            const entries = Object.entries(samples);
            
            if (entries.length < 4) {
                console.warn(`Not enough samples: ${entries.length}. Adding default samples.`);
                for (let i = entries.length; i < 4; i++) {
                    const sampleId = EXPECTED_SAMPLE_IDS[i];
                    entries.push([String(i), { ...DEFAULT_WHISKEY_SAMPLE, id: sampleId }]);
                }
            }

            entries.slice(0, 4).forEach((entry, index) => {
                const [_, sampleData] = entry;
                const sampleId = EXPECTED_SAMPLE_IDS[index];
                const validSampleData = (typeof sampleData === 'object' && sampleData !== null) ? sampleData as Partial<WhiskeySample> : {};
                
                transformedSamples[sampleId] = {
                    ...DEFAULT_WHISKEY_SAMPLE,
                    ...validSampleData,
                    id: sampleId,
                    name: validSampleData.name || `Sample ${sampleId}`
                };
            });
        }

        // Validate and ensure all samples exist
        EXPECTED_SAMPLE_IDS.forEach(id => {
            if (!transformedSamples[id]) {
                console.warn(`Missing sample ${id}, adding default`);
                transformedSamples[id] = {
                    ...DEFAULT_WHISKEY_SAMPLE,
                    id,
                    name: `Sample ${id}`
                };
            }
        });

        console.log('Transformed samples:', transformedSamples);
        return transformedSamples;

    } catch (error) {
        console.error('Error transforming samples:', error);
        
        // Return default samples if transformation fails
        return EXPECTED_SAMPLE_IDS.reduce((acc, id) => ({
            ...acc,
            [id]: {
                ...DEFAULT_WHISKEY_SAMPLE,
                id,
                name: `Sample ${id}`
            }
        }), {} as Record<SampleId, WhiskeySample>);
    }
};

export const validateSampleStructure = (samples: Record<SampleId, WhiskeySample>): boolean => {
    return EXPECTED_SAMPLE_IDS.every(id => {
        const sample = samples[id];
        return (
            sample &&
            typeof sample === 'object' &&
            typeof sample.age === 'number' &&
            typeof sample.proof === 'number' &&
            typeof sample.mashbill === 'string'
        );
    });
};

export const formatSampleData = (sample: any, index: number): WhiskeySample => {
    const sampleId = EXPECTED_SAMPLE_IDS[index] || 'A';
    return {
        ...DEFAULT_WHISKEY_SAMPLE,
        ...sample,
        id: sampleId,
        name: `Sample ${sampleId}`
    };
};