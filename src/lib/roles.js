export function extractRoles(user) {
  if (!user) return [];
  
  // 1) Check if we have manually set roles in the user object (from our custom API)
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles;
  }
  
  // 2) Auto-assign roles based on email domain (for development/demo)
  if (user.email) {
    const email = user.email.toLowerCase();
    
    // Manager patterns - includes admin emails and codeby1 emails
    if (email.includes("manager") || email.includes("admin") || email.includes("naley58065") || email.endsWith("@hospital.com")) {
      return ["manager"];
    }
    
    // Employee patterns  
    if (email.includes("employee") || email.includes("nurse") || email.includes("doctor")) {
      return ["employee"];
    }
  }
  
  // 3) Preferred: custom claim namespace configured via env
  const ns = process.env.NEXT_PUBLIC_AUTH0_ROLES_NAMESPACE;
  if (ns) {
    const claim = user[ns];
    if (Array.isArray(claim)) return claim;
    if (typeof claim === "string") return [claim];
  }
  
  // 4) Common custom claim default used in this app
  const def = user["https://shifter.dev/roles"];
  if (Array.isArray(def)) return def;
  if (typeof def === "string") return [def];
  
  // 5) Generic properties often present
  if (Array.isArray(user.roles)) return user.roles;
  if (typeof user.role === "string") return [user.role];
  if (Array.isArray(user.permissions)) return user.permissions;
  
  // 6) Optional local fallback for development
  const fallback = process.env.NEXT_PUBLIC_DEFAULT_ROLE;
  if (typeof fallback === "string" && fallback.length > 0) return [fallback];
  
  // 7) Default to employee if no specific role found
  return ["employee"];
}

// Helper function to check if user has a specific role
export function hasRole(user, role) {
  const roles = extractRoles(user);
  return roles.includes(role);
}

// Helper function to check if user is manager
export function isManager(user) {
  return hasRole(user, "manager");
}

// Helper function to check if user is employee
export function isEmployee(user) {
  return hasRole(user, "employee");
}

// Get role assignment reason for debugging
export function getRoleAssignmentReason(user) {
  if (!user) return 'No user provided';
  
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return 'Manually assigned roles from API';
  }
  
  if (user.email) {
    const email = user.email.toLowerCase();
    
    if (email.includes("manager")) {
      return 'Email contains "manager"';
    }
    if (email.includes("admin")) {
      return 'Email contains "admin"';
    }
    if (email.endsWith("@hospital.com")) {
      return 'Email ends with "@hospital.com"';
    }
    if (email.includes("nurse")) {
      return 'Email contains "nurse"';
    }
    if (email.includes("doctor")) {
      return 'Email contains "doctor"';
    }
    if (email.includes("employee")) {
      return 'Email contains "employee"';
    }
  }
  
  const fallback = process.env.NEXT_PUBLIC_DEFAULT_ROLE;
  if (fallback) {
    return `Using environment default: ${fallback}`;
  }
  
  return 'Using system default: employee';
}
