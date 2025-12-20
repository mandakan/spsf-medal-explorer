# PR-002: Data Layer & Storage System

## DESCRIPTION
Implement the data persistence layer with localStorage support and a modular data manager interface. This enables user profiles to be created, saved, and loaded while keeping the door open for future backend API integration (per 05-Technical-Architecture.md).

## DEPENDENCIES
- PR-001: Project Setup & Medal Database (needs models.js and medals.json)

## ACCEPTANCE CRITERIA
- [ ] DataManager abstract interface defined with required methods
- [ ] LocalStorageDataManager fully implements DataManager
- [ ] User profiles save and load from localStorage without data loss
- [ ] Import/export JSON functionality works correctly
- [ ] Storage format matches schema in 02-Data-Model.md
- [ ] Data validation prevents invalid profiles from being saved
- [ ] Unit tests verify save/load roundtrip with sample profiles
- [ ] Error handling for localStorage quota exceeded and corrupted data
- [ ] Code structure follows 05-Technical-Architecture.md data layer design

## FILES TO CREATE
- js/data/data-manager.js (abstract interface)
- js/data/storage.js (localStorage implementation)
- js/logic/exporter.js (import/export functionality)
- tests/storage.test.js (save/load verification)
- tests/exporter.test.js (import/export tests)

## CODE STRUCTURE

### js/data/data-manager.js

Abstract interface that all storage implementations must follow:

```javascript
/**
 * Abstract data manager interface
 * All storage implementations (localStorage, API, etc.) must implement these methods
 */
class DataManager {
  // User Profile Operations
  async getUserProfile(userId) { 
    throw new Error('Not implemented'); 
  }
  
  async saveUserProfile(profile) { 
    throw new Error('Not implemented'); 
  }
  
  async getAllProfiles() { 
    throw new Error('Not implemented'); 
  }
  
  async deleteProfile(userId) { 
    throw new Error('Not implemented'); 
  }
  
  // Medal Database Access
  async getMedalDatabase() { 
    throw new Error('Not implemented'); 
  }
  
  // Achievement Operations
  async getAchievements(userId) { 
    throw new Error('Not implemented'); 
  }
  
  async addAchievement(userId, achievement) { 
    throw new Error('Not implemented'); 
  }
  
  async updateAchievement(userId, achievementId, achievement) { 
    throw new Error('Not implemented'); 
  }
  
  async removeAchievement(userId, achievementId) { 
    throw new Error('Not implemented'); 
  }
  
  // Import/Export
  async exportData(userId) { 
    throw new Error('Not implemented'); 
  }
  
  async importData(jsonData) { 
    throw new Error('Not implemented'); 
  }
}
```

### js/data/storage.js

localStorage implementation per 02-Data-Model.md Storage Architecture:

```javascript
/**
 * LocalStorage-based data manager for POC phase
 * Stores everything in browser's localStorage under key 'medal-app-data'
 */
class LocalStorageDataManager extends DataManager {
  constructor(medalDatabase) {
    super();
    this.medalDb = medalDatabase;
    this.storageKey = 'medal-app-data';
    this.initializeStorage();
  }
  
  /**
   * Initialize storage structure if it doesn't exist
   */
  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        version: '1.0',
        profiles: [],
        lastBackup: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(initialData));
    }
  }
  
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    const data = this.getStorageData();
    return data.profiles.find(p => p.userId === userId) || null;
  }
  
  /**
   * Save or update user profile
   */
  async saveUserProfile(profile) {
    // Validate profile structure
    if (!this.validateProfile(profile)) {
      throw new Error('Invalid profile structure');
    }
    
    const data = this.getStorageData();
    profile.lastModified = new Date().toISOString();
    
    const index = data.profiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) {
      data.profiles[index] = profile;
    } else {
      profile.createdDate = new Date().toISOString();
      data.profiles.push(profile);
    }
    
    this.saveStorageData(data);
    return profile;
  }
  
  /**
   * Get all profiles (for profile selector)
   */
  async getAllProfiles() {
    const data = this.getStorageData();
    return data.profiles;
  }
  
  /**
   * Delete profile
   */
  async deleteProfile(userId) {
    const data = this.getStorageData();
    data.profiles = data.profiles.filter(p => p.userId !== userId);
    this.saveStorageData(data);
  }
  
  /**
   * Get medal database
   */
  async getMedalDatabase() {
    return this.medalDb;
  }
  
  /**
   * Get all achievements for user
   */
  async getAchievements(userId) {
    const profile = await this.getUserProfile(userId);
    return profile ? profile.prerequisites || [] : [];
  }
  
  /**
   * Add achievement to profile
   */
  async addAchievement(userId, achievement) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('Profile not found');
    
    if (!this.validateAchievement(achievement)) {
      throw new Error('Invalid achievement structure');
    }
    
    if (!achievement.id) {
      achievement.id = `achievement-${Date.now()}`;
    }
    
    profile.prerequisites.push(achievement);
    await this.saveUserProfile(profile);
    return achievement;
  }
  
  /**
   * Update existing achievement
   */
  async updateAchievement(userId, achievementId, achievement) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('Profile not found');
    
    const index = profile.prerequisites.findIndex(a => a.id === achievementId);
    if (index < 0) throw new Error('Achievement not found');
    
    profile.prerequisites[index] = { ...achievement, id: achievementId };
    await this.saveUserProfile(profile);
    return profile.prerequisites[index];
  }
  
  /**
   * Remove achievement from profile
   */
  async removeAchievement(userId, achievementId) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('Profile not found');
    
    profile.prerequisites = profile.prerequisites.filter(a => a.id !== achievementId);
    await this.saveUserProfile(profile);
  }
  
  /**
   * Validate profile structure per 02-Data-Model.md
   */
  validateProfile(profile) {
    return profile.userId && 
           typeof profile.displayName === 'string' &&
           Array.isArray(profile.unlockedMedals) &&
           Array.isArray(profile.prerequisites);
  }
  
  /**
   * Validate achievement structure
   */
  validateAchievement(achievement) {
    return achievement.type && 
           achievement.year &&
           achievement.weaponGroup &&
           (achievement.points !== undefined || achievement.points !== null);
  }
  
  /**
   * Get raw storage data
   */
  getStorageData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read storage:', error);
      throw new Error('Storage data corrupted');
    }
  }
  
  /**
   * Save raw storage data
   */
  saveStorageData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded');
      }
      throw error;
    }
  }
}
```

### js/logic/exporter.js

Import/export functionality:

```javascript
/**
 * Handles data import and export
 */
class DataExporter {
  /**
   * Export profile data as JSON string
   */
  static exportProfileAsJson(profile) {
    const exportData = {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      userProfile: {
        displayName: profile.displayName,
        weaponGroupPreference: profile.weaponGroupPreference,
        createdDate: profile.createdDate
      },
      achievements: profile.prerequisites || [],
      unlockedMedals: profile.unlockedMedals || []
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Export as downloadable file
   */
  static downloadProfileAsJson(profile) {
    const json = this.exportProfileAsJson(profile);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medal-profile-${profile.userId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Export as CSV (for spreadsheets)
   */
  static exportAchievementsAsCsv(achievements) {
    const headers = ['Date', 'Type', 'Year', 'Weapon Group', 'Points/Score', 'Competition'];
    const rows = achievements.map(a => [
      a.date || '',
      a.type || '',
      a.year || '',
      a.weaponGroup || '',
      a.points || '',
      a.competitionName || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csv;
  }
  
  /**
   * Parse imported JSON
   * @returns {Object} Parsed data with validation
   */
  static parseImportedJson(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.exportVersion) {
        throw new Error('Invalid export file: missing exportVersion');
      }
      
      if (!data.userProfile || !data.achievements || !Array.isArray(data.unlockedMedals)) {
        throw new Error('Invalid export file: missing required sections');
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }
  
  /**
   * Import from file
   */
  static async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = this.parseImportedJson(e.target.result);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
```

### tests/storage.test.js

```javascript
describe('LocalStorageDataManager', () => {
  let storage;
  let sampleProfile;
  
  beforeEach(() => {
    localStorage.clear();
    // Create fresh manager with mock medal db
    const mockMedalDb = { medals: [] };
    storage = new LocalStorageDataManager(mockMedalDb);
    
    sampleProfile = new UserProfile({
      userId: 'user-123',
      displayName: 'Test User',
      weaponGroupPreference: 'A',
      unlockedMedals: [],
      prerequisites: []
    });
  });
  
  test('saves profile to storage', async () => {
    const saved = await storage.saveUserProfile(sampleProfile);
    expect(saved.userId).toBe('user-123');
    expect(saved.lastModified).toBeDefined();
  });
  
  test('loads saved profile', async () => {
    await storage.saveUserProfile(sampleProfile);
    const loaded = await storage.getUserProfile('user-123');
    expect(loaded.displayName).toBe('Test User');
  });
  
  test('adds achievement to profile', async () => {
    await storage.saveUserProfile(sampleProfile);
    
    const achievement = new Achievement({
      type: 'gold_series',
      year: 2025,
      weaponGroup: 'A',
      points: 42,
      date: '2025-06-15'
    });
    
    await storage.addAchievement('user-123', achievement);
    const profile = await storage.getUserProfile('user-123');
    expect(profile.prerequisites.length).toBe(1);
  });
  
  test('removes achievement from profile', async () => {
    await storage.saveUserProfile(sampleProfile);
    const achievement = new Achievement({
      id: 'ach-1',
      type: 'gold_series',
      year: 2025,
      weaponGroup: 'A',
      points: 42,
      date: '2025-06-15'
    });
    
    await storage.addAchievement('user-123', achievement);
    await storage.removeAchievement('user-123', 'ach-1');
    const profile = await storage.getUserProfile('user-123');
    expect(profile.prerequisites.length).toBe(0);
  });
  
  test('deletes profile', async () => {
    await storage.saveUserProfile(sampleProfile);
    await storage.deleteProfile('user-123');
    const loaded = await storage.getUserProfile('user-123');
    expect(loaded).toBeNull();
  });
  
  test('validates profile before saving', async () => {
    const invalidProfile = { userId: null };
    expect(() => storage.validateProfile(invalidProfile)).toBe(false);
  });
  
  test('gets all profiles', async () => {
    const profile1 = new UserProfile({ userId: 'user-1', displayName: 'User 1' });
    const profile2 = new UserProfile({ userId: 'user-2', displayName: 'User 2' });
    
    await storage.saveUserProfile(profile1);
    await storage.saveUserProfile(profile2);
    const all = await storage.getAllProfiles();
    expect(all.length).toBe(2);
  });
  
  test('handles storage quota exceeded', async () => {
    // Mock localStorage to throw QuotaExceededError
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });
    
    await expect(storage.saveUserProfile(sampleProfile))
      .rejects
      .toThrow('Storage quota exceeded');
    
    Storage.prototype.setItem = originalSetItem;
  });
});

describe('DataExporter', () => {
  let profile;
  
  beforeEach(() => {
    profile = new UserProfile({
      userId: 'user-123',
      displayName: 'Test User',
      weaponGroupPreference: 'A',
      unlockedMedals: [{
        medalId: 'pistol-mark-bronze',
        unlockedDate: '2025-01-15',
        year: 2025
      }],
      prerequisites: [{
        id: 'ach-1',
        type: 'gold_series',
        year: 2025,
        weaponGroup: 'A',
        points: 42,
        date: '2025-06-15',
        competitionName: 'Club Championship'
      }]
    });
  });
  
  test('exports profile as JSON string', () => {
    const json = DataExporter.exportProfileAsJson(profile);
    expect(json).toContain('exportVersion');
    expect(json).toContain('Test User');
  });
  
  test('parses imported JSON', () => {
    const json = DataExporter.exportProfileAsJson(profile);
    const parsed = DataExporter.parseImportedJson(json);
    expect(parsed.userProfile.displayName).toBe('Test User');
  });
  
  test('exports achievements as CSV', () => {
    const csv = DataExporter.exportAchievementsAsCsv(profile.prerequisites);
    expect(csv).toContain('Date,Type,Year');
    expect(csv).toContain('2025');
  });
  
  test('rejects invalid JSON', () => {
    expect(() => DataExporter.parseImportedJson('invalid json'))
      .toThrow('Failed to parse JSON');
  });
});
```

## DESIGN DOCUMENT REFERENCES
- **02-Data-Model.md** - Storage Schema, User Profile, Achievement Object sections
- **05-Technical-Architecture.md** - Data Layer, DataManager interface design

## INTEGRATION NOTES
- DataManager is intentionally abstract so we can swap localStorage for an API later
- All async methods return Promises (ready for future API layer)
- Storage validates data before saving (prevent invalid states)
- Error messages are descriptive for user feedback (see 05-Technical-Architecture.md Logger section)

## DONE WHEN
- DataManager abstract class defined
- LocalStorageDataManager implements all required methods
- All CRUD operations work correctly
- Import/export functions round-trip data without loss
- Validation prevents invalid data from being saved
- All tests pass locally
- No console errors or warnings
- Storage quota handling gracefully informs user
