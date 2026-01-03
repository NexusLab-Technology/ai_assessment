import { ConfigManager } from '../config';

describe('ConfigManager', () => {
  beforeEach(() => {
    // Reset config before each test
    ConfigManager.resetConfig();
    
    // Clear environment variables
    delete process.env.AUTH_ENABLED;
    delete process.env.NEXT_PUBLIC_AUTH_ENABLED;
    delete process.env.SESSION_TIMEOUT;
    delete process.env.NEXT_PUBLIC_SESSION_TIMEOUT;
    delete process.env.REMEMBER_SIDEBAR;
    delete process.env.NEXT_PUBLIC_REMEMBER_SIDEBAR;
  });

  describe('isAuthEnabled', () => {
    it('should default to true when AUTH_ENABLED is not set', () => {
      expect(ConfigManager.isAuthEnabled()).toBe(true);
    });

    it('should return true when AUTH_ENABLED is "true"', () => {
      process.env.AUTH_ENABLED = 'true';
      ConfigManager.resetConfig();
      expect(ConfigManager.isAuthEnabled()).toBe(true);
    });

    it('should return false when AUTH_ENABLED is "false"', () => {
      process.env.AUTH_ENABLED = 'false';
      ConfigManager.resetConfig();
      expect(ConfigManager.isAuthEnabled()).toBe(false);
    });

    it('should handle case insensitive values', () => {
      process.env.AUTH_ENABLED = 'TRUE';
      ConfigManager.resetConfig();
      expect(ConfigManager.isAuthEnabled()).toBe(true);

      process.env.AUTH_ENABLED = 'FALSE';
      ConfigManager.resetConfig();
      expect(ConfigManager.isAuthEnabled()).toBe(false);
    });
  });

  describe('getAuthConfig', () => {
    it('should return default configuration when no env vars are set', () => {
      const config = ConfigManager.getAuthConfig();
      
      expect(config).toEqual({
        authEnabled: true,
        sessionTimeout: 3600000,
        rememberSidebar: true,
        defaultRoute: '/',
      });
    });

    it('should parse custom session timeout', () => {
      process.env.SESSION_TIMEOUT = '7200000';
      ConfigManager.resetConfig();
      
      const config = ConfigManager.getAuthConfig();
      expect(config.sessionTimeout).toBe(7200000);
    });

    it('should use default session timeout for invalid values', () => {
      process.env.SESSION_TIMEOUT = 'invalid';
      ConfigManager.resetConfig();
      
      const config = ConfigManager.getAuthConfig();
      expect(config.sessionTimeout).toBe(3600000);
    });

    it('should cache configuration after first call', () => {
      const config1 = ConfigManager.getAuthConfig();
      const config2 = ConfigManager.getAuthConfig();
      
      expect(config1).toBe(config2); // Same object reference
    });
  });
});