export function getBackendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) {
    throw new Error(
      'BACKEND_URL environment variable is not set. ' +
        'Add it to .env.local (see .env.example for reference).'
    );
  }
  return url;
}

export function getAgentApiKey(): string {
  const key = process.env.AGENT_API_KEY;
  if (!key) {
    throw new Error(
      'AGENT_API_KEY environment variable is not set. ' +
        'Add it to .env.local (see .env.example for reference).'
    );
  }
  return key;
}
