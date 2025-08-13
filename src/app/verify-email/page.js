
'use client';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const handleRelogin = () => {
    // Force logout (SSO) and re-login to get fresh session with updated email_verified status
    window.location.href = '/api/auth/logout?sso=1';
  };

  const handleResendEmail = async () => {
    try {
      // This would typically call Auth0 Management API to resend verification email
      // For now, we'll just show an alert
      alert('Please check your Auth0 dashboard to resend verification email manually, or contact your administrator.');
    } catch (error) {
      console.error('Error resending verification email:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mb-6">
          <svg 
            className="mx-auto h-12 w-12 text-blue-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Verify Your Email Address
        </h1>
        
        <p className="text-gray-600 mb-6">
          We&apos;ve sent a verification link to your email address. Please check your email and click the link to verify your account.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> After clicking the verification link in your email, please return here and click the button below to refresh your session.
          </p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={handleRelogin}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            I&apos;ve verified my email - Continue to Dashboard
          </button>
          
          <button 
            onClick={handleResendEmail}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Resend verification email
          </button>
          
          <Link 
            href="/api/auth/logout?sso=1"
            className="block text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Log out and use a different account
          </Link>
        </div>
        
        <div className="mt-6 text-xs text-gray-400">
          <p>
            If you don&apos;t see the email, check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
