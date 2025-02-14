import { WhiskeySample, SampleId, MASHBILL_TYPES } from '../types/game.types';

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
    score: 'score A',
    challengeQuestions: [],
    image: '',
    rating: 0,
    type: '',
    region: '',
    imageUrl: '',
    price: 0
};

export const transformQuarterSamples = (samplesMap: Record<string, any>): Record<SampleId, WhiskeySample> => {
    if (!samplesMap) return EXPECTED_SAMPLE_IDS.reduce((acc, id) => ({
        ...acc,
        [id]: { ...DEFAULT_WHISKEY_SAMPLE, id, name: `Sample ${id}` }
    }), {} as Record<SampleId, WhiskeySample>);

    console.log("Raw Samples from Firestore:", samplesMap);

    let transformedSamples: Record<SampleId, WhiskeySample> = EXPECTED_SAMPLE_IDS.reduce((acc, id) => ({
        ...acc,
        [id]: { ...DEFAULT_WHISKEY_SAMPLE, id, name: `Sample ${id}` }
    }), {} as Record<SampleId, WhiskeySample>);

    try {
        const samplesArray = Object.keys(samplesMap).map(key => ({
            id: key,
            ...samplesMap[key]
        }));

        samplesArray.forEach((sample, index) => {
            console.log(`Transforming Sample ${EXPECTED_SAMPLE_IDS[index]}`, sample);
        });

        if (samplesArray.length < 4) {
            console.warn(`Not enough samples: ${samplesArray.length}. Adding default samples.`);
            while (samplesArray.length < 4) {
                samplesArray.push({ ...DEFAULT_WHISKEY_SAMPLE });
            }
        }

        samplesArray.slice(0, 4).forEach((sample, index) => {
            const sampleId: SampleId = EXPECTED_SAMPLE_IDS[index];
            transformedSamples[sampleId] = {
                ...DEFAULT_WHISKEY_SAMPLE,
                ...sample,
                id: sampleId,
                name: sample.name || `Sample ${sampleId}`
            };
        });

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