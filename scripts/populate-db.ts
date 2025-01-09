import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Your Firebase config here
const firebaseConfig = { /* config */ };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initial Quarters Data
const quartersData = [
  {
    id: 'Q1-2024',
    name: 'Q1 2024',
    active: true,
    samples: [
      {
        id: 'sample-a',
        age: 10,
        proof: 100,
        mashbill: 'Bourbon'
      },
      // Add other samples
    ]
  }
];

// Game Configurations
const gameConfigs = {
  scoringRules: {
    age: {
      maxPoints: 30,
      pointDeductionPerYear: 3
    },
    proof: {
      maxPoints: 30,
      pointDeductionPerProof: 2
    },
    mashbill: {
      correctGuessPoints: 10
    }
  },
  availableMashbills: ['Bourbon', 'Rye', 'Wheat', 'Single Malt', 'Specialty']
};

async function populateDatabase() {
  try {
    // Populate Quarters
    for (const quarter of quartersData) {
      await setDoc(doc(db, 'quarters', quarter.id), quarter);
    }

    // Add Game Configuration
    await setDoc(doc(db, 'game_configurations', 'default'), gameConfigs);

    console.log('Database populated successfully');
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

populateDatabase();
