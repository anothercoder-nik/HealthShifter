export async function POST(req) {
  try {
    // Clear all Auth0-related cookies
    const response = new Response('Session cleared', { status: 200 });
    
    // Clear common Auth0 cookie names
    const cookiesToClear = [
      'appSession',
      'appSession.0',
      'appSession.1',
      'auth0.state',
      'auth0.nonce',
    ];
    
    cookiesToClear.forEach(cookieName => {
      response.headers.append('Set-Cookie', `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`);
    });
    
    return response;
  } catch (error) {
    console.error('Clear session error:', error);
    return new Response('Error clearing session', { status: 500 });
  }
}

export async function GET(req) {
  return POST(req);
}
