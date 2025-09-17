import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Expected env vars
const USER_POOL_ID = import.meta.env.COGNITO_USER_POOL_ID as string;
const CLIENT_ID = import.meta.env.COGNITO_USER_POOL_CLIENT_ID as string;
// Region is embedded in the issuer of the token; not needed to construct the verifier

if (!USER_POOL_ID || !CLIENT_ID) {
  // eslint-disable-next-line no-console
  console.warn(
    '[auth] Missing COGNITO_USER_POOL_ID or COGNITO_USER_POOL_CLIENT_ID in environment; verification will fail.'
  );
}

export const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  clientId: CLIENT_ID,
  tokenUse: 'id',
});

export const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  clientId: CLIENT_ID,
  tokenUse: 'access',
});

export type AuthRole = 'anonymous' | 'basic' | 'elevated';

export interface VerifiedUser {
  claims: Record<string, any>;
  role: AuthRole;
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('='));
  }
  return out;
}

export async function verifyRequest(request: Request): Promise<VerifiedUser | null> {
  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const cookies = parseCookies(request.headers.get('cookie'));
  const cookieId = cookies['id_token'] || null;
  const cookieAccess = cookies['access_token'] || null;

  const tryTokens = [bearer, cookieId, cookieAccess].filter(Boolean) as string[];

  for (const token of tryTokens) {
    try {
      // Try verify as ID then ACCESS
      let payload: any;
      try {
        payload = await idTokenVerifier.verify(token);
      } catch {
        payload = await accessTokenVerifier.verify(token);
      }
      const groups: string[] = (payload['cognito:groups'] as string[]) || [];
      const role: AuthRole = groups.includes('elevated')
        ? 'elevated'
        : groups.includes('basic')
          ? 'basic'
          : 'basic'; // any verified user is at least basic
      return { claims: payload, role };
    } catch {
      // continue
    }
  }
  return null;
}

export function hasMinRole(user: VerifiedUser | null, min: AuthRole): boolean {
  if (!user) return min === 'anonymous';
  const order: Record<AuthRole, number> = { anonymous: 0, basic: 1, elevated: 2 };
  return order[user.role] >= order[min];
}
