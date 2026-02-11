/**
 * Domain utility for restricting admin access to specific domains
 */

export const ADMIN_ALLOWED_DOMAINS = [
  'konfetti-capacitor-integration.lovable.app',
  'localhost',
  'id-preview--7a0a3a9e-8f38-4e9e-a88e-1ba73be4e2cc.lovable.app',
  'admin.konfetti.app'
];

/**
 * Check if the current domain allows admin access
 */
export const isAdminDomainAllowed = (): boolean => {
  const hostname = window.location.hostname;
  return ADMIN_ALLOWED_DOMAINS.some(domain => 
    hostname === domain || hostname.endsWith(`.${domain}`)
  );
};

/**
 * Check if the current domain is the admin subdomain
 */
export const isAdminSubdomain = (): boolean => {
  return window.location.hostname === 'admin.konfetti.app';
};

/**
 * Check if the current domain is the production domain
 */
export const isProductionDomain = (): boolean => {
  return window.location.hostname === 'konfetti.app';
};
