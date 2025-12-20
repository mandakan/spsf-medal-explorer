/**
 * Represents a single medal
 */
class Medal {
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.tier = data.tier;
    this.name = data.name;
    this.displayName = data.displayName;
    this.color = data.color;
    this.icon = data.icon;
    this.description = data.description || '';
    this.prerequisites = Array.isArray(data.prerequisites) ? data.prerequisites : [];
    this.requirements = Array.isArray(data.requirements) ? data.requirements : [];
    this.unlocksFollowingMedals = Array.isArray(data.unlocksFollowingMedals) ? data.unlocksFollowingMedals : [];
    this.yearIntroduced = data.yearIntroduced;
    this.sortOrder = data.sortOrder;
  }
}

/**
 * Represents a user's profile and achievements
 */
class UserProfile {
  constructor(data = {}) {
    this.userId = data.userId;
    this.displayName = data.displayName || '';
    this.createdDate = data.createdDate || new Date().toISOString();
    this.lastModified = data.lastModified || new Date().toISOString();
    this.weaponGroupPreference = data.weaponGroupPreference || 'A';
    this.unlockedMedals = Array.isArray(data.unlockedMedals) ? data.unlockedMedals : [];
    this.prerequisites = Array.isArray(data.prerequisites) ? data.prerequisites : [];
  }
}

/**
 * Represents a single achievement (gold series, competition result, etc.)
 */
class Achievement {
  constructor(data) {
    this.id = data.id;
    this.type = data.type; // 'gold_series', 'competition_result', etc.
    this.year = data.year;
    this.weaponGroup = data.weaponGroup;
    this.points = data.points;
    this.date = data.date;
    this.competitionName = data.competitionName || '';
    this.notes = data.notes || '';
  }
}

/**
 * Medal database manager
 */
class MedalDatabase {
  constructor(medalDataJson) {
    this.version = medalDataJson.version || '1.0';
    this.medals = (medalDataJson.medals || []).map(m => new Medal(m));
  }

  getMedalById(medalId) {
    return this.medals.find(m => m.id === medalId);
  }

  getMedalsByType(type) {
    return this.medals.filter(m => m.type === type);
  }

  getMedalsByTier(tier) {
    return this.medals.filter(m => m.tier === tier);
  }
}

// Expose to browser global (non-module) usage
if (typeof window !== 'undefined') {
  window.Medal = Medal;
  window.UserProfile = UserProfile;
  window.Achievement = Achievement;
  window.MedalDatabase = MedalDatabase;
}

// CommonJS export for Node/Jest environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Medal, UserProfile, Achievement, MedalDatabase };
}
