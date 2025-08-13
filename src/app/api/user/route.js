import { getSession, withApiAuthRequired, withEmailVerification } from "../../../lib/auth";
import { extractRoles } from "../../../lib/roles";

export const GET = withApiAuthRequired(async function userHandler(request) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = session.user;
    const roles = extractRoles(user);

    return Response.json({
      user: {
        ...user,
        roles: roles
      },
      roleInfo: {
        assignedRoles: roles,
        assignmentReason: getAssignmentReason(user.email, roles)
      }
    });
  } catch (error) {
    console.error('User API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

export const POST = withEmailVerification(async function userPostHandler(request) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { role } = await request.json();
    
    if (!['manager', 'employee'].includes(role)) {
      return new Response('Invalid role', { status: 400 });
    }

    // In a real app, you would save this to a database or update Auth0 user metadata
    // For now, we'll return the updated user with the role
    const updatedUser = {
      ...session.user,
      roles: [role],
      [process.env.NEXT_PUBLIC_AUTH0_ROLES_NAMESPACE || 'https://shifter.dev/roles']: [role]
    };

    return Response.json({
      success: true,
      user: updatedUser,
      message: `Role updated to ${role}`
    });
  } catch (error) {
    console.error('User API POST error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

function getAssignmentReason(email, roles) {
  if (!email) return 'No email provided - using default';
  
  if (email.includes("manager") || email.includes("admin")) {
    return 'Email contains "manager" or "admin"';
  }
  
  if (email.endsWith("@hospital.com")) {
    return 'Email ends with "@hospital.com"';
  }
  
  if (email.includes("employee") || email.includes("nurse") || email.includes("doctor")) {
    return `Email contains "${email.includes("nurse") ? "nurse" : email.includes("doctor") ? "doctor" : "employee"}"`;
  }
  
  return 'No pattern matched - using default (employee)';
}
