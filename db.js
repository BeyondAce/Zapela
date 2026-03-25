/**
 * db.js — Zapela.gg API Client
 * Replaces direct localStorage with backend API calls.
 * Falls back gracefully on network errors.
 */

const API = {
  // ─── AUTH TOKEN ───────────────────────────────
  token() { return localStorage.getItem('zap_token') || ''; },
  setToken(t) { localStorage.setItem('zap_token', t); },
  clearToken() { localStorage.removeItem('zap_token'); },

  // ─── BASE FETCH ───────────────────────────────
  async req(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.token() },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch('/api' + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  get(path) { return this.req('GET', path); },
  post(path, body) { return this.req('POST', path, body); },
  put(path, body) { return this.req('PUT', path, body); },
  del(path) { return this.req('DELETE', path); },

  // ─── PLATFORM STATS ──────────────────────────
  async stats() { return this.get('/stats'); },

  // ─── COMMUNITY PLUGINS ───────────────────────
  async plugins(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get('/plugins' + (qs ? '?' + qs : ''));
  },

  // ─── AUTH ─────────────────────────────────────
  async register(username, email, password) {
    const r = await this.post('/auth/register', { username, email, password });
    this.setToken(r.token);
    return r;
  },
  async login(username, password) {
    const r = await this.post('/auth/login', { username, password });
    this.setToken(r.token);
    return r;
  },
  async demoLogin() {
    const r = await this.post('/auth/demo');
    this.setToken(r.token);
    return r;
  },
  async logout() {
    try { await this.post('/auth/logout'); } catch {}
    this.clearToken();
  },

  // ─── CURRENT USER ────────────────────────────
  async me() { return this.get('/me'); },
  async updateProfile(data) { return this.put('/me/profile', data); },
  async changePassword(current, newPassword, confirm) { return this.put('/me/password', { current, newPassword, confirm }); },
  async updateNotifications(data) { return this.put('/me/notifications', data); },
  async deleteAccount() { return this.del('/me'); },

  // ─── USER PLUGINS ────────────────────────────
  async myPlugins() { return this.get('/me/plugins'); },
  async addPlugin(data) { return this.post('/me/plugins', data); },
  async updatePlugin(id, data) { return this.put('/me/plugins/' + id, data); },
  async deletePlugin(id) { return this.del('/me/plugins/' + id); },

  // ─── NOTES ────────────────────────────────────
  async notes() { return this.get('/me/notes'); },
  async addNote(data) { return this.post('/me/notes', data); },
  async updateNote(id, data) { return this.put('/me/notes/' + id, data); },
  async deleteNote(id) { return this.del('/me/notes/' + id); },

  // ─── ACTIVITY ─────────────────────────────────
  async activity() { return this.get('/me/activity'); },

  // ─── API KEY ──────────────────────────────────
  async apiKey() { return this.get('/me/apikey'); },
  async regenApiKey() { return this.post('/me/apikey/regen'); },
};

// Legacy SEED data for fallback / offline browsing
const SEED = [
  { id:'ep', name:'EcoPlugin Pro',  icon:'EP', cat:'ECONOMY',    author:'xDevMaster', ver:'1.20', dl:48200, rating:4.9, desc:'Full-featured economy plugin with market signs, bank accounts, shop GUI, multiple currencies, auction houses, and full API hooks.' },
  { id:'pg', name:'PixelGuard',     icon:'PG', cat:'ANTI-GRIEF', author:'NullByte',   ver:'1.21', dl:31700, rating:4.8, desc:'Advanced grief prevention with claim zones, block-level rollback, audit logs, and Discord webhook alerts.' },
  { id:'sb', name:'SkyBlock X',     icon:'SB', cat:'GAMEMODE',   author:'CloudDev',   ver:'1.20', dl:29400, rating:4.7, desc:'Complete SkyBlock gamemode with island leveling, challenges, custom mobs, economy integration, and a full GUI menu.' },
  { id:'cm', name:'CombatMaster',   icon:'CM', cat:'PVP',        author:'SteelCraft', ver:'1.21', dl:22100, rating:4.6, desc:'PVP overhaul with combo system, accurate hit registration, kill streaks, leaderboards, and tournament support.' },
  { id:'tw', name:'TownWars',       icon:'TW', cat:'FACTIONS',   author:'Archon',     ver:'1.19', dl:19800, rating:4.5, desc:'Factions with town diplomacy, war declarations, territory maps, siege mechanics, and resource war events.' },
  { id:'qc', name:'QuestCore',      icon:'QC', cat:'RPG',        author:'loredev',    ver:'1.20', dl:17300, rating:4.8, desc:'RPG quest engine with NPC dialogs, branching objectives, loot tables, and a full reward system.' },
  { id:'ar', name:'AutoRank Pro',   icon:'AR', cat:'UTILITY',    author:'rankify',    ver:'1.21', dl:14200, rating:4.4, desc:'Automated rank promotion based on playtime, money, kills, or custom goals. Full PlaceholderAPI and LuckPerms support.' },
  { id:'vx', name:'VaultX',         icon:'VX', cat:'ECONOMY',    author:'CryptoMC',   ver:'1.20', dl:11500, rating:4.3, desc:'Next-gen economy backend with vaults, interest rates, cross-server sync, and full EconAPI compatibility.' },
  { id:'dm', name:'DungeonMaster',  icon:'DM', cat:'RPG',        author:'herocraft',  ver:'1.20', dl:9300,  rating:4.6, desc:'Instanced dungeon system with custom mobs, multi-phase bosses, loot chests, and full party support.' },
  { id:'ms', name:'MagicSpells',    icon:'MS', cat:'RPG',        author:'spelldev',   ver:'1.21', dl:8100,  rating:4.5, desc:'Custom spell system with 100+ built-in spells, wand items, cooldowns, mana system, and a powerful config API.' },
  { id:'wg', name:'WorldGuard+',    icon:'WG', cat:'ANTI-GRIEF', author:'guarded',    ver:'1.21', dl:7800,  rating:4.7, desc:'Region protection system with 80+ flags, entry/exit hooks, visual region display, and full developer API.' },
  { id:'bs', name:'BossSpawns',     icon:'BS', cat:'GAMEMODE',   author:'elitedev',   ver:'1.20', dl:6200,  rating:4.2, desc:'Custom boss framework with dynamic health bars, multi-phase AI, minion spawning, and configurable drop tables.' },
];
