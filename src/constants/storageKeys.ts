// Centralized Storage Keys for LocalStorage & SessionStorage

export const STORAGE_KEYS = {
  // Session & Authentication
  AUTH_TOKEN: 'ntf_auth_token',
  PRIVATE_ACCESS_ENABLED: 'ntf_private_access_enabled',
  
  // User Progress
  USER_NAME: 'ntf_user_name',
  COMPLETED_TASKS: 'ntf_completed_tasks',
  SUBMITTED_CREDITS: 'ntf_submitted_credits',
  CREDITS_SUBMITTED_NAME: 'ntf_submitted_name',
  
  // Admin Caches
  ADMIN_LOCAL_POSTS: 'admin_local_posts',
  ADMIN_SETTINGS_CACHE: 'admin_settings_cache',
  ADMIN_FOLLOWER_CACHE: 'admin_follower_cache',
  
  // Custom Filters & View Settings
  ACTIVE_PHASE: 'ntf_active_phase',
  ACTIVE_SECTION: 'ntf_active_section',
} as const;
