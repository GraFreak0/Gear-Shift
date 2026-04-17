// Part label map — single source of truth so machine slots and tray icons always match
export const PART_LABEL = {
  gear: '⚙',
  spring: '🌀',
  chip: '💾',
  wire: '〰',
  capacitor: '🔋',
  piston: '🔩',
  valve: '🔧',
  pipe: '🔗',
  bolt: '⚡',
};

// All possible slot positions a machine can use (randomly sampled at spawn time)
export const SLOT_POOL = [
  { x: -55, y: -12 },
  { x: -30, y: 14 },
  { x: -10, y: -14 },
  { x: 12, y: 14 },
  { x: 35, y: -12 },
  { x: 58, y: 8 },
  { x: -5, y: 0 },
  { x: 25, y: -8 },
  { x: -45, y: 8 },
];

// All parts the pool can draw from per machine tier
export const PARTS_BY_TIER = {
  1: ['gear', 'spring'],
  2: ['gear', 'spring', 'chip', 'wire'],
  3: ['gear', 'spring', 'chip', 'wire', 'capacitor', 'piston'],
  4: ['gear', 'spring', 'chip', 'wire', 'capacitor', 'piston', 'valve', 'pipe', 'bolt'],
};

function pickParts(tier, count) {
  const pool = [...(PARTS_BY_TIER[tier] || PARTS_BY_TIER[4])];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function buildSlots(tier, count, positions) {
  const parts = pickParts(tier, count);
  // Shuffle positions too for variety
  const shuffledPos = [...positions];
  for (let i = shuffledPos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPos[i], shuffledPos[j]] = [shuffledPos[j], shuffledPos[i]];
  }
  return parts.map((partId, i) => ({
    id: `slot_${i}`,
    x: shuffledPos[i].x,
    y: shuffledPos[i].y,
    requiredPart: partId,
    label: PART_LABEL[partId],
  }));
}

// Machine type templates — slots are generated dynamically at spawn time via getSlots()
export const MACHINE_TYPES = [
  {
    id: 'motor',
    name: 'Simple Motor',
    color: 0xc0844a,
    bodyWidth: 100,
    bodyHeight: 70,
    slotCount: 1,
    tier: 1,
    minLevel: 1,
    getSlots() { return buildSlots(this.tier, this.slotCount, SLOT_POOL.slice(0, 5)); },
  },
  {
    id: 'clock',
    name: 'Clock Mechanism',
    color: 0xa0a0c0,
    bodyWidth: 110,
    bodyHeight: 75,
    slotCount: 2,
    tier: 1,
    minLevel: 2,
    getSlots() { return buildSlots(this.tier, this.slotCount, SLOT_POOL.slice(0, 5)); },
  },
  {
    id: 'circuit',
    name: 'Circuit Board',
    color: 0x4a8c4a,
    bodyWidth: 120,
    bodyHeight: 75,
    slotCount: 3,
    tier: 2,
    minLevel: 4,
    getSlots() { return buildSlots(this.tier, this.slotCount, SLOT_POOL.slice(0, 6)); },
  },
  {
    id: 'steam',
    name: 'Steam Engine',
    color: 0x8b6355,
    bodyWidth: 130,
    bodyHeight: 80,
    slotCount: 4,
    tier: 3,
    minLevel: 6,
    getSlots() { return buildSlots(this.tier, this.slotCount, SLOT_POOL.slice(0, 7)); },
  },
  {
    id: 'robot',
    name: 'Robot Core',
    color: 0x5577aa,
    bodyWidth: 140,
    bodyHeight: 90,
    slotCount: 5,
    tier: 4,
    minLevel: 9,
    getSlots() { return buildSlots(this.tier, this.slotCount, SLOT_POOL); },
  },
  {
    id: 'boss_mega',
    name: '⚠ MEGA MACHINE',
    color: 0xaa2222,
    bodyWidth: 200,
    bodyHeight: 110,
    isBoss: true,
    slotCount: 6,
    tier: 4,
    minLevel: 10,
    bossOnly: true,
    getSlots() { return buildSlots(this.tier, this.slotCount, SLOT_POOL); },
  },
];

export const PART_TYPES = [
  { id: 'gear', label: PART_LABEL.gear, color: 0xe8c96a, name: 'Gear' },
  { id: 'spring', label: PART_LABEL.spring, color: 0x88ddff, name: 'Spring' },
  { id: 'chip', label: PART_LABEL.chip, color: 0x66cc88, name: 'Chip' },
  { id: 'wire', label: PART_LABEL.wire, color: 0xffaa44, name: 'Wire' },
  { id: 'capacitor', label: PART_LABEL.capacitor, color: 0xcc66aa, name: 'Capacitor' },
  { id: 'piston', label: PART_LABEL.piston, color: 0xaaaaaa, name: 'Piston' },
  { id: 'valve', label: PART_LABEL.valve, color: 0xff8866, name: 'Valve' },
  { id: 'pipe', label: PART_LABEL.pipe, color: 0x99bbcc, name: 'Pipe' },
  { id: 'bolt', label: PART_LABEL.bolt, color: 0xffee66, name: 'Bolt' },
];