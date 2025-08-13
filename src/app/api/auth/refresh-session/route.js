import { getSession } from "@auth0/nextjs-auth0";

export async function POST(request) {
  try {
    console.log('Simple session refresh endpoint called');
    
    // Get current session
    const session = await getSession(request);
    if (!session?.user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No active session found'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Current email_verified:', session.user.email_verified);

    // Since we can't easily refresh the session without Management API,
    // we'll return the current status and let the client decide what to do
    return new Response(JSON.stringify({
      success: true,
      email_verified: session.user.email_verified,
      email: session.user.email,
      message: session.user.email_verified ? 
        'Email is already verified!' : 
        'Email not verified. Please use re-login option.',
      needsRelogin: !session.user.email_verified
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to check session',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
