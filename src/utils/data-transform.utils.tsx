import { WhiskeySample, SampleId, MASHBILL_TYPES, Score } from '../types/game.types';

const EXPECTED_SAMPLE_IDS: SampleId[] = ['A', 'B', 'C', 'D'];

export const DEFAULT_WHISKEY_SAMPLE: Omit<WhiskeySample, 'id'> = {
    name: '',
    age: 0,
    proof: 0,
    mashbill: MASHBILL_TYPES.BOURBON,
    hints: [],
    distillery: '',
    description: '',
    notes: [],
    difficulty: 'beginner',
    score: 'score A' as Score,
    challengeQuestions: [],
    image: '',
    rating: 0,
    type: '',
    region: '',
    imageUrl: '',
    price: 0
};

const validateSample = (sample: any): boolean => {
    const isValid = sample && 
        typeof sample.age === 'number' && 
        typeof sample.proof === 'number' && 
        typeof sample.mashbill === 'string';
    
    if (!isValid) {
        console.error('Sample validation failed:', {
            hasAge: typeof sample?.age === 'number',
            hasProof: typeof sample?.proof === 'number',
            hasMashbill: typeof sample?.mashbill === 'string',
            sample
        });
    }
    
    return isValid;
};

const createDefaultSample = (id: SampleId): WhiskeySample => ({
    ...DEFAULT_WHISKEY_SAMPLE,
    id,
    name: `Sample ${id}`
});

const createDefaultSamples = (): Record<SampleId, WhiskeySample> => {
    const samples: Record<SampleId, WhiskeySample> = {
        A: createDefaultSample('A'),
        B: createDefaultSample('B'),
        C: createDefaultSample('C'),
        D: createDefaultSample('D')
    };
    return samples;
};

export const transformQuarterSamples = (samplesInput: any): Record<SampleId, WhiskeySample> => {
    if (!samplesInput) {
        console.warn('No samples input provided, creating defaults');
        return createDefaultSamples();
    }

    console.log("Raw Samples from Firestore:", samplesInput);

    const transformedSamples: Record<SampleId, WhiskeySample> = createDefaultSamples();

    try {
        let samplesArray: any[];
        if (Array.isArray(samplesInput)) {
            samplesArray = samplesInput;
        } else if (typeof samplesInput === 'object') {
            samplesArray = Object.entries(samplesInput).map(([key, value]) => ({
                id: key,
                ...(typeof value === 'object' ? value : {})
            }));
        } else {
            console.error('Invalid samples input format:', samplesInput);
            return transformedSamples;
        }

        samplesArray.forEach((sample, index) => {
            if (index >= EXPECTED_SAMPLE_IDS.length) return;
            
            const sampleId = EXPECTED_SAMPLE_IDS[index];
            console.log(`Processing sample ${sampleId}:`, sample);
            
            if (validateSample(sample)) {
                transformedSamples[sampleId] = {
                    ...DEFAULT_WHISKEY_SAMPLE,
                    ...sample,
                    id: sampleId,
                    score: `score ${sampleId}` as Score,
                    name: sample.name || `Sample ${sampleId}`
                };
                console.log(`Successfully transformed sample ${sampleId}:`, transformedSamples[sampleId]);
            } else {
                console.error(`Invalid sample data for ${sampleId}, using default:`, sample);
                transformedSamples[sampleId] = createDefaultSample(sampleId);
            }
        });

        return transformedSamples;

    } catch (error) {
        console.error('Error transforming samples:', error);
        return transformedSamples;
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