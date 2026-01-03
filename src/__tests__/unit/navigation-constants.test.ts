/**
 * Unit tests for navigation constants
 * Tests that main navigation contains only "Home" 
 * and that Settings is moved to USER_ACTION_NAVIGATION
 * 
 * Requirements: 2.1, 2.2, 2.4
 */

import { DEFAULT_NAVIGATION, USER_ACTION_NAVIGATION } from '@/lib/constants';

describe('Navigation Constants', () => {
  describe('DEFAULT_NAVIGATION', () => {
    it('should contain only Home navigation item in main nav', () => {
      const homeItem = DEFAULT_NAVIGATION.find(item => item.id === 'home');
      const settingsItem = DEFAULT_NAVIGATION.find(item => item.id === 'settings');
      const profileItem = DEFAULT_NAVIGATION.find(item => item.id === 'profile');
      
      expect(homeItem).toBeDefined();
      expect(settingsItem).toBeUndefined(); // Settings moved to USER_ACTION_NAVIGATION
      expect(profileItem).toBeUndefined();
    });

    it('should have exactly 1 navigation item (Home only)', () => {
      expect(DEFAULT_NAVIGATION).toHaveLength(1);
    });

    it('should maintain Home navigation item unchanged', () => {
      const homeItem = DEFAULT_NAVIGATION.find(item => item.id === 'home');
      
      expect(homeItem).toEqual({
        id: 'home',
        label: 'Home',
        icon: '🏠',
        href: '/',
      });
    });

    it('should have all required properties for each navigation item', () => {
      DEFAULT_NAVIGATION.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('href');
        
        expect(typeof item.id).toBe('string');
        expect(typeof item.label).toBe('string');
        expect(typeof item.icon).toBe('string');
        expect(typeof item.href).toBe('string');
        
        expect(item.id).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeTruthy();
        expect(item.href).toBeTruthy();
      });
    });
  });

  describe('USER_ACTION_NAVIGATION', () => {
    it('should contain Settings navigation item', () => {
      const settingsItem = USER_ACTION_NAVIGATION.find(item => item.id === 'settings');
      
      expect(settingsItem).toBeDefined();
    });

    it('should have Settings item with correct label', () => {
      const settingsItem = USER_ACTION_NAVIGATION.find(item => item.id === 'settings');
      
      expect(settingsItem?.label).toBe('Settings');
    });

    it('should have Settings item with appropriate settings icon', () => {
      const settingsItem = USER_ACTION_NAVIGATION.find(item => item.id === 'settings');
      
      expect(settingsItem?.icon).toBe('⚙️');
    });

    it('should have Settings item with correct href to /settings route', () => {
      const settingsItem = USER_ACTION_NAVIGATION.find(item => item.id === 'settings');
      
      expect(settingsItem?.href).toBe('/settings');
    });

    it('should have exactly 1 user action item (Settings only)', () => {
      expect(USER_ACTION_NAVIGATION).toHaveLength(1);
    });
  });
});