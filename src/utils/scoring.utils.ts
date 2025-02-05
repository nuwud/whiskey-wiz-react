// scoring.utils.ts

const AGE_POINTS = 35;
const PROOF_POINTS = 35;
const MASHBILL_POINTS = 30;

const AGE_GRACE_YEARS = 2;
const PROOF_GRACE_POINTS = 5;

export const calculateAgeScore = (actual: number, guess: number): number => {
    const difference = Math.abs(actual - guess);
    if (difference === 0) return AGE_POINTS; // Perfect match
    if (difference <= AGE_GRACE_YEARS) {
        // Within grace period - reduce points proportionally
        return Math.round(AGE_POINTS * (1 - (difference / (AGE_GRACE_YEARS + 1))));
    }
    return 0; // Outside grace period
};

export const calculateProofScore = (actual: number, guess: number): number => {
    const difference = Math.abs(actual - guess);
    if (difference === 0) return PROOF_POINTS; // Perfect match
    if (difference <= PROOF_GRACE_POINTS) {
        // Within grace period - reduce points proportionally
        return Math.round(PROOF_POINTS * (1 - (difference / (PROOF_GRACE_POINTS + 1))));
    }
    return 0; // Outside grace period
};

export const calculateMashbillScore = (actual: string, guess: string): number => {
    return actual.toLowerCase() === guess.toLowerCase() ? MASHBILL_POINTS : 0;
};

export const calculateTotalScore = (
    actual: { age: number; proof: number; mashbill: string },
    guess: { age: number; proof: number; mashbill: string }
): { total: number; breakdown: { age: number; proof: number; mashbill: number } } => {
    const ageScore = calculateAgeScore(actual.age, guess.age);
    const proofScore = calculateProofScore(actual.proof, guess.proof);
    const mashbillScore = calculateMashbillScore(actual.mashbill, guess.mashbill);

    return {
        total: ageScore + proofScore + mashbillScore,
        breakdown: {
            age: ageScore,
            proof: proofScore,
            mashbill: mashbillScore
        }
    };
};

export const getScoreExplanation = (
    actual: { age: number; proof: number; mashbill: string },
    guess: { age: number; proof: number; mashbill: string }
): { age: string; proof: string; mashbill: string } => {
    const ageDiff = Math.abs(actual.age - guess.age);
    const proofDiff = Math.abs(actual.proof - guess.proof);

    return {
        age: ageDiff === 0 ? "Perfect match!" :
            ageDiff <= AGE_GRACE_YEARS ? `Close! Off by ${ageDiff} years` :
                `Off by ${ageDiff} years - outside grace period`,

        proof: proofDiff === 0 ? "Perfect match!" :
            proofDiff <= PROOF_GRACE_POINTS ? `Close! Off by ${proofDiff} proof points` :
                `Off by ${proofDiff} proof points - outside grace period`,

        mashbill: actual.mashbill.toLowerCase() === guess.mashbill.toLowerCase() ?
            "Correct mashbill type!" :
            "Incorrect mashbill type"
    };
};