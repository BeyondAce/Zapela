/**
 * db.js — Zapela.gg Database Layer
 * All data is persisted to localStorage under the 'zap_' prefix.
 * No external dependencies — pure vanilla JS.
 */

// ═══════════════════════════════════════
// SEED PLUGIN DATA (community catalogue)
// ═══════════════════════════════════════
const SEED = [
  { id:'ep', name:'EcoPlugin Pro',  icon:'EP', cat:'ECONOMY',    author:'xDevMaster', ver:'1.20', dl:48200, desc:'Full-featured economy plugin with market signs, bank accounts, shop GUI, multiple currencies, auction houses, and full API hooks for third-party integration.' },
  { id:'pg', name:'PixelGuard',     icon:'PG', cat:'ANTI-GRIEF', author:'NullByte',   ver:'1.21', dl:31700, desc:'Advanced grief prevention with claim zones, block-level rollback, audit logs, and Discord webhook alerts. Best in class for survival and SMP servers.' },
  { id:'sb', name:'SkyBlock X',     icon:'SB', cat:'GAMEMODE',   author:'CloudDev',   ver:'1.20', dl:29400, desc:'Complete SkyBlock gamemode with island leveling, challenges, custom mobs, economy integration, and a full GUI menu system. Drop-in setup.' },
  { id:'cm', name:'CombatMaster',   icon:'CM', cat:'PVP',        author:'SteelCraft', ver:'1.21', dl:22100, desc:'PVP overhaul with combo system, accurate hit registration, kill streaks, leaderboards, and tournament bracket support.' },
  { id:'tw', name:'TownWars',       icon:'TW', cat:'FACTIONS',   author:'Archon',     ver:'1.19', dl:19800, desc:'Factions with town diplomacy, war declarations, territory maps, siege mechanics, and resource war events.' },
  { id:'qc', name:'QuestCore',      icon:'QC', cat:'RPG',        author:'loredev',    ver:'1.20', dl:17300, desc:'RPG quest engine with NPC dialogs, branching objectives, loot tables, and a full reward system with MySQL and SQLite support.' },
  { id:'ar', name:'AutoRank Pro',   icon:'AR', cat:'UTILITY',    author:'rankify',    ver:'1.21', dl:14200, desc:'Automated rank promotion based on playtime, money, kills, or custom goals. Full PlaceholderAPI and LuckPerms support.' },
  { id:'vx', name:'VaultX',         icon:'VX', cat:'ECONOMY',    author:'CryptoMC',   ver:'1.20', dl:11500, desc:'Next-gen economy backend with vaults, configurable interest rates, cross-server sync, and full EconAPI compatibility.' },
  { id:'dm', name:'DungeonMaster',  icon:'DM', cat:'RPG',        author:'herocraft',  ver:'1.20', dl:9300,  desc:'Instanced dungeon system with custom mobs, multi-phase bosses, loot chests, and full party and group support.' },
  { id:'ms', name:'MagicSpells',    icon:'MS', cat:'RPG',        author:'spelldev',   ver:'1.21', dl:8100,  desc:'Custom spell system with 100+ built-in spells, wand items, cooldowns, mana system, and a powerful config API.' },
  { id:'wg', name:'WorldGuard+',    icon:'WG', cat:'ANTI-GRIEF', author:'guarded',    ver:'1.21', dl:7800,  desc:'Region protection system with 80+ flags, entry/exit hooks, visual region display, and full developer API.' },
  { id:'bs', name:'BossSpawns',     icon:'BS', cat:'GAMEMODE',   author:'elitedev',   ver:'1.20', dl:6200,  desc:'Custom boss framework with dynamic health bars, multi-phase AI, minion spawning, and fully configurable drop tables.' },
];

// ═══════════════════════════════════════
// DATABASE API
// ═══════════════════════════════════════
const DB = {

  // ── LOW-LEVEL STORAGE ──────────────────
  get(key) {
    try { return JSON.parse(localStorage.getItem('zap_' + key)) || null; }
    catch { return null; }
  },
  set(key, value) {
    localStorage.setItem('zap_' + key, JSON.stringify(value));
  },
  del(key) {
    localStorage.removeItem('zap_' + key);
  },

  // ── USERS ──────────────────────────────
  /** Returns all users as { username: userData } */
  users() {
    return this.get('users') || {};
  },
  /** Saves or updates a single user record */
  saveUser(username, data) {
    const all = this.users();
    all[username] = data;
    this.set('users', all);
  },
  /** Returns a single user's data, or null */
  user(username) {
    return this.users()[username] || null;
  },

  // ── SESSION ────────────────────────────
  /** Returns the current session { u: username, t: timestamp } or null */
  session() {
    return this.get('session');
  },
  /** Creates a new session for the given username */
  setSession(username) {
    this.set('session', { u: username, t: Date.now() });
  },
  /** Destroys the current session */
  clearSession() {
    this.del('session');
  },

  // ── PLUGINS (per user) ─────────────────
  /** Returns array of plugins owned by a user */
  plugins(username) {
    return this.get('pl_' + username) || [];
  },
  /** Overwrites the entire plugins array for a user */
  savePl(username, arr) {
    this.set('pl_' + username, arr);
  },
  /** Prepends a new plugin to the user's list */
  addPl(username, plugin) {
    const arr = this.plugins(username);
    arr.unshift(plugin);
    this.savePl(username, arr);
  },

  // ── NOTES (per user) ───────────────────
  /** Returns array of notes for a user */
  notes(username) {
    return this.get('nt_' + username) || [];
  },
  /** Overwrites the entire notes array for a user */
  saveNt(username, arr) {
    this.set('nt_' + username, arr);
  },

  // ── ACTIVITY LOG (per user) ────────────
  /** Returns last 30 activity entries for a user */
  activity(username) {
    return this.get('ac_' + username) || [];
  },
  /**
   * Prepends a new activity entry and trims to 30 entries.
   * @param {string} username
   * @param {string} msg  - Human-readable message
   * @param {string} c    - Dot colour: 'green' | 'amber' | 'info' | 'red'
   */
  addAc(username, msg, c = 'green') {
    const arr = this.activity(username);
    arr.unshift({ msg, c, t: Date.now() });
    this.set('ac_' + username, arr.slice(0, 30));
  },

  // ── API KEYS ───────────────────────────
  /** Returns the user's API key, generating one if it doesn't exist */
  apiKey(username) {
    const existing = this.get('ak_' + username);
    if (existing) return existing;
    const newKey = 'zap_sk_live_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    this.set('ak_' + username, newKey);
    return newKey;
  },
  /** Generates and saves a new API key for the user, returns the new key */
  regenKey(username) {
    const newKey = 'zap_sk_live_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    this.set('ak_' + username, newKey);
    return newKey;
  },

  // ── DEMO ACCOUNT ───────────────────────
  /**
   * Creates the ZapDemo account with pre-loaded data if it doesn't exist.
   * Safe to call multiple times.
   */
  seedDemo() {
    if (this.user('ZapDemo')) return; // already exists

    this.saveUser('ZapDemo', {
      username:    'ZapDemo',
      email:       'demo@zapela.gg',
      password:    'demo1234',
      displayName: 'ZapDemo',
      bio:         'Demo account — explore everything Zapela has to offer!',
      website:     '',
      discord:     '',
      joined:      Date.now(),
      lastLogin:   Date.now(),
    });

    this.savePl('ZapDemo', [
      {
        id: 'd1', name: 'EcoPlugin Pro', icon: 'EP', cat: 'ECONOMY', ver: '1.20',
        dl: 48200, desc: 'Full economy plugin with market signs and auction house.',
        status: 'live', size: '124KB', uploaded: Date.now() - 172800000,
        wdl: [4200, 5800, 4900, 7200, 5600, 8100, 6800],
      },
      {
        id: 'd2', name: 'PixelGuard', icon: 'PG', cat: 'ANTI-GRIEF', ver: '1.21',
        dl: 31700, desc: 'Advanced grief prevention with rollback and Discord alerts.',
        status: 'live', size: '89KB', uploaded: Date.now() - 432000000,
        wdl: [2800, 3400, 3100, 4200, 3600, 5100, 4400],
      },
      {
        id: 'd3', name: 'QuestCore Beta', icon: 'QC', cat: 'RPG', ver: '1.21',
        dl: 0, desc: 'Quest engine — still in development.',
        status: 'draft', size: '210KB', uploaded: Date.now() - 1555200000,
        wdl: [0, 0, 0, 0, 0, 0, 0],
      },
    ]);

    this.saveNt('ZapDemo', [
      {
        id: 'n1', title: 'EcoPlugin Pro — v3.3 Roadmap',
        content: 'TODO: Fix chest dupe exploit\nAdd /eco market command\nSupport 1.21.4 API\nCustom currency textures',
        tags: ['ECOPLUGIN'], created: Date.now() - 7200000, updated: Date.now() - 7200000,
      },
      {
        id: 'n2', title: 'Bug Tracker — PixelGuard',
        content: 'BUG: NullPointer on player join\nBUG: Market sign reset on server restart\nFIX: Claim radius off by 1 block',
        tags: ['PIXELGUARD'], created: Date.now() - 86400000, updated: Date.now() - 86400000,
      },
      {
        id: 'n3', title: 'Community Feature Requests',
        content: 'Discord bot integration (12 votes)\nOffline player transaction log\nMulti-server Redis sync',
        tags: ['IDEAS'], created: Date.now() - 259200000, updated: Date.now() - 259200000,
      },
    ]);

    this.addAc('ZapDemo', 'EcoPlugin Pro hit 48K downloads 🎉', 'amber');
    this.addAc('ZapDemo', 'New ★★★★★ review on PixelGuard', 'info');
    this.addAc('ZapDemo', 'PixelGuard downloaded by voidcraft', 'green');
    this.addAc('ZapDemo', 'SkyKit setup downloaded by darkforge', 'green');
  },
};
