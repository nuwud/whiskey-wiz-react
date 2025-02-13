// src/utils/env-check.utils.ts  (rename from .tsx to .ts)
interface EnvVarError extends Error {
  type: 'ENV_ERROR';
}

export const verifyEnvironment = (): void => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
  ] as const;

  const missing = requiredVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    ) as EnvVarError;
    error.type = 'ENV_ERROR';
    throw error;
  }
};

export const handleEnvironmentError = (error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error';
  
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <h1>Configuration Error</h1>
        <p>${errorMessage}</p>
      </div>
    </div>
  `;
};