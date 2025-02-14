import { config } from 'dotenv';
import process from 'process';

config(
    // Load environment variables from a `.env` file
    { path: process.env.NODE_ENV === "production" ? ".env.production" : ".env", readOnly: true },
    // Override existing environment variables
    { path: ".env.local" }
);

// Define the required environment variables for Firebase
const requiredEnvVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_DATABASE_URL",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_FIREBASE_MEASUREMENT_ID",
];

const missingVars = requiredEnvVars.filter(
    (varName) => typeof process !== "undefined" && !process.env[varName]
);

if (missingVars.length > 0) {
    console.error("Missing required environment variables:", missingVars);
    process.exit(1);
}
