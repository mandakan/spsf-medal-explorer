const fs = require('fs');
const path = require('path');

const { MedalDatabase, Achievement } = require(path.resolve(__dirname, '../js/data/models.js'));

function loadMedalJson() {
  const p = path.resolve(__dirname, '../data/medals.json');
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw);
}

describe('Medal Database', () => {
  let medalDb;

  beforeAll(() => {
    const data = loadMedalJson();
    medalDb = new MedalDatabase(data);
  });

  test('loads all medals successfully', () => {
    expect(medalDb.medals.length).toBeGreaterThan(10);
  });

  test('finds medal by id', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze');
    expect(medal).toBeDefined();
    expect(medal.displayName).toBe('Pistol Mark - Bronze');
  });

  test('bronze pistol mark has no prerequisites', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze');
    expect(Array.isArray(medal.prerequisites)).toBe(true);
    expect(medal.prerequisites.length).toBe(0);
  });

  test('silver pistol mark requires bronze', () => {
    const medal = medalDb.getMedalById('pistol-mark-silver');
    expect(medal.prerequisites.some(p => p.medalId === 'pistol-mark-bronze')).toBe(true);
  });

  test('gold series requirement has correct point thresholds', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze');
    const goldSeriesReq = medal.requirements.find(r => r.type === 'gold_series');
    expect(goldSeriesReq.pointThresholds.A.min).toBe(32);
    expect(goldSeriesReq.pointThresholds.B.min).toBe(33);
    expect(goldSeriesReq.pointThresholds.C.min).toBe(34);
  });

  test('medals unlock following medals correctly', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze');
    expect(medal.unlocksFollowingMedals).toContain('pistol-mark-silver');
    expect(medal.unlocksFollowingMedals).toContain('elite-mark-bronze');
  });

  test('medal references are valid (prereqs and unlocks)', () => {
    const ids = new Set(medalDb.medals.map(m => m.id));
    for (const medal of medalDb.medals) {
      for (const prereq of medal.prerequisites || []) {
        if (prereq.type === 'medal') {
          expect(ids.has(prereq.medalId)).toBe(true);
        }
      }
      for (const unlockId of medal.unlocksFollowingMedals || []) {
        expect(ids.has(unlockId)).toBe(true);
      }
    }
  });
});

describe('Achievement Class', () => {
  test('creates achievement with required fields', () => {
    const achievement = new Achievement({
      id: 'a1',
      type: 'gold_series',
      year: 2025,
      weaponGroup: 'A',
      points: 42,
      date: '2025-06-15'
    });
    expect(achievement.year).toBe(2025);
    expect(achievement.weaponGroup).toBe('A');
  });
});
