import { WhiskeySample, Score, SampleId } from '../types/game.types';

export const transformQuarterSamples = (samples: any): WhiskeySample[] => {
    console.log('Input to transformQuarterSamples:', samples);  // Debug log

    if (!samples) {
        console.log('No samples provided');
        return [];
    }

    // If it's already an array, return it
    if (Array.isArray(samples)) {
        return samples;
    }

    // If it's an object with sample1, sample2, etc.
    if (typeof samples === 'object' && samples !== null) {
        if (Object.keys(samples).length === 0) {
            console.log('Empty samples object');
            return [];
        }

        const sampleArray = Object.entries(samples)
            .filter(([key]) => /^sample\d+$/.test(key))
            .sort(([a], [b]) => {
                const aNum = parseInt(a.replace('sample', ''));
                const bNum = parseInt(b.replace('sample', ''));
                return aNum - bNum;
            })
            .map(([key, value], index) => ({
                ...(value as object),
                id: String.fromCharCode(65 + index) as SampleId, // 'A', 'B', 'C', 'D'
                name: `Sample ${String.fromCharCode(65 + parseInt(key.replace('sample', '')) - 1)}`,
                age: (value as any).age || 0,
                proof: (value as any).proof || 0,
                mashbill: (value as any).mashbill || 'bourbon',
                hints: Array.isArray((value as any).hints) ? (value as any).hints : [],
                distillery: (value as any).distillery || 'Unknown',
                description: (value as any).description || '',
                notes: Array.isArray((value as any).notes) ? (value as any).notes : [],
                difficulty: (value as any).difficulty || 'beginner',
                score: 'score' as Score,
                challengeQuestions: Array.isArray((value as any).challengeQuestions) ? (value as any).challengeQuestions : [],
                image: (value as any).image || ''
            }));

        console.log('Transformed samples:', sampleArray);  // Debug log
        return sampleArray;
    }

    console.log('Invalid samples format:', typeof samples);  // Debug log
    return [];
};

export const validateSample = (sample: any): boolean => {
    return (
        sample &&
        typeof sample === 'object' &&
        typeof sample.age === 'number' &&
        typeof sample.proof === 'number' &&
        typeof sample.mashbill === 'string'
    );
};

export const formatSampleData = (sample: any, index: number): WhiskeySample => {
    return {
        id: `sample${index + 1}`,
        name: `Sample ${String.fromCharCode(65 + index)}`,
        age: sample.age || 0,
        proof: sample.proof || 0,
        mashbill: sample.mashbill || 'bourbon',
        hints: sample.hints || [],
        distillery: sample.distillery || 'Unknown',
        description: sample.description || '',
        notes: sample.notes || [],
        difficulty: sample.difficulty || 'beginner',
        score: 'score' as Score,  // Fixed: Use a valid Score value
        challengeQuestions: sample.challengeQuestions || [],
        image: sample.image || ''
    };
};