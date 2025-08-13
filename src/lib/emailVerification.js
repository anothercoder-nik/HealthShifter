// This function checks if user's email is verified
export function isEmailVerified(user) {
  return user?.email_verified === true;
}

// This function creates a response for unverified users
export function createUnverifiedResponse() {
  return new Response(
    JSON.stringify({ 
      error: 'Email not verified', 
      message: 'Please verify your email before accessing this resource' 
    }), 
    { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}