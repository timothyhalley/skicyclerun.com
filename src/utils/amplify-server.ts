import { Amplify } from 'aws-amplify';
import outputs from '@config/amplify_outputs.json';

// Configure Amplify for SSR (idempotent if called more than once)
Amplify.configure(outputs, { ssr: true });

export async function runWithAmplifyServerContext<T>({
  cookieHeader,
  operation,
}: {
  cookieHeader: string | null;
  operation: (contextSpec: any) => Promise<T> | T;
}): Promise<T> {
  // Build the ContextSpec expected by aws-amplify/auth/server
  const contextSpec = { headers: { cookie: cookieHeader ?? '' } };
  return await operation(contextSpec);
}
