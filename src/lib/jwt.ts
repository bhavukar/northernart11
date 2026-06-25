const encoder = new TextEncoder();

// Base64url encoding/decoding helper functions
function base64urlEncode(str: string): string {
  // Use btoa safely. Next.js environment supports btoa.
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

export async function signJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64urlEncode(JSON.stringify(header));
  const payloadStr = base64urlEncode(JSON.stringify(payload));
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const data = encoder.encode(`${headerStr}.${payloadStr}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${headerStr}.${payloadStr}.${sigStr}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const data = encoder.encode(`${header}.${payload}`);
    
    // Convert signature back to buffer
    const sigBin = base64urlDecode(signature);
    const sigBuf = new Uint8Array(sigBin.length);
    for (let i = 0; i < sigBin.length; i++) {
      sigBuf[i] = sigBin.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuf, data);
    if (!isValid) return null;
    
    const decodedPayloadStr = base64urlDecode(payload);
    const decodedPayload = JSON.parse(decodedPayloadStr);
    
    // Check expiration if present
    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    console.error('JWT verify error:', error);
    return null;
  }
}
