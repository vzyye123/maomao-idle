import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import express from "express";
import { Server as SocketServer } from "socket.io";
import { c as battleMonsterCatalog, f as farmingCatalog } from "../pulled-frontend/_nuxt/game-jresource-BuAYGK_i.js";
import { a as resourceCatalog } from "../pulled-frontend/_nuxt/game-json-resources-C7HDgHOG.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..", "pulled-frontend");
const actionDurationMs = (() => {
  try {
    const actionFile = fs.readdirSync(path.join(frontendRoot, "_nuxt")).find((name) => name.startsWith("game-json-actions-") && name.endsWith(".js"));
    if (!actionFile) return {};
    const source = fs.readFileSync(path.join(frontendRoot, "_nuxt", actionFile), "utf8");
    const durations = {};
    const pattern = /(?:^|,)([A-Za-z0-9_]+):\{id:"([^"]+)"[^{}]*?baseDuration:([0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?)/g;
    for (const match of source.matchAll(pattern)) {
      const duration = Number(match[3]);
      if (Number.isFinite(duration) && duration > 0) durations[match[2]] = duration;
    }
    return durations;
  } catch {
    return {};
  }
})();
const actionImprovements = (() => {
  try {
    const actionFile = fs.readdirSync(path.join(frontendRoot, "_nuxt")).find((name) => name.startsWith("game-json-actions-") && name.endsWith(".js"));
    if (!actionFile) return {};
    const source = fs.readFileSync(path.join(frontendRoot, "_nuxt", actionFile), "utf8");
    const actions = [...source.matchAll(/(?:^|,)([A-Za-z0-9_]+):\{id:"([^"]+)"/g)];
    const improvements = {};
    actions.forEach((match, index) => {
      const start = match.index + (match[0].startsWith(",") ? 1 : 0);
      const end = actions[index + 1]?.index ?? source.length;
      const actionSource = source.slice(start, end);
      const improveMatch = actionSource.match(/characterImprove:\[([^\]]*)\]/);
      if (!improveMatch) return;
      const values = [...improveMatch[1].matchAll(/\{status:"([^"]+)",increaseExp:([0-9]+(?:\.[0-9]+)?)\}/g)]
        .map((improve) => ({ status: improve[1], increaseExp: Number(improve[2]) }));
      if (values.length) improvements[match[2]] = values;
    });
    return improvements;
  } catch {
    return {};
  }
})();
const actionRewards = (() => {
  try {
    const actionFile = fs.readdirSync(path.join(frontendRoot, "_nuxt")).find((name) => name.startsWith("game-json-actions-") && name.endsWith(".js"));
    if (!actionFile) return {};
    const source = fs.readFileSync(path.join(frontendRoot, "_nuxt", actionFile), "utf8");
    const rewards = {};
    const actions = [...source.matchAll(/(?:^|,)([A-Za-z0-9_]+):\{id:"([^"]+)"/g)];
    actions.forEach((match, index) => {
      const start = match.index + (match[0].startsWith(",") ? 1 : 0);
      const end = actions[index + 1]?.index ?? source.length;
      const actionSource = source.slice(start, end);
      const rewardMatch = actionSource.match(/rewards:\[([\s\S]*?)\],characterImprove:/);
      if (!rewardMatch) return;
      const values = [...rewardMatch[1].matchAll(/\{id:"([^"]+)",percent:([^,}]+)(?:,count:([^,}]+)|,range:\{min:([^,}]+),max:([^,}]+)\})?/g)]
        .map((reward) => ({
          resourceId: reward[1],
          percent: Number(reward[2]),
          count: reward[3] === undefined ? null : Number(reward[3]),
          min: reward[4] === undefined ? null : Number(reward[4]),
          max: reward[5] === undefined ? null : Number(reward[5])
        }))
        .filter((reward) => reward.resourceId && Number.isFinite(reward.percent));
      if (values.length) rewards[match[2]] = values;
    });
    return rewards;
  } catch {
    return {};
  }
})();
const actionRequirements = (() => {
  try {
    const actionFile = fs.readdirSync(path.join(frontendRoot, "_nuxt")).find((name) => name.startsWith("game-json-actions-") && name.endsWith(".js"));
    if (!actionFile) return {};
    const source = fs.readFileSync(path.join(frontendRoot, "_nuxt", actionFile), "utf8");
    const requirements = {};
    const actions = [...source.matchAll(/(?:^|,)([A-Za-z0-9_]+):\{id:"([^"]+)"/g)];
    actions.forEach((match, index) => {
      const start = match.index + (match[0].startsWith(",") ? 1 : 0);
      const end = actions[index + 1]?.index ?? source.length;
      const actionSource = source.slice(start, end);
      const resourceMatch = actionSource.match(/requirement:\{[\s\S]*?resource:\[([^\]]*)\]/);
      if (!resourceMatch) return;
      const values = [...resourceMatch[1].matchAll(/\{id:"([^"]+)",count:([^,}]+)\}/g)]
        .map((requirement) => ({ resourceId: requirement[1], count: Number(requirement[2]) }))
        .filter((requirement) => requirement.resourceId && Number.isFinite(requirement.count) && requirement.count > 0);
      if (values.length) requirements[match[2]] = values;
    });
    return requirements;
  } catch {
    return {};
  }
})();
const actionNames = (() => {
  try {
    const actionFile = fs.readdirSync(path.join(frontendRoot, "_nuxt")).find((name) => name.startsWith("game-json-actions-") && name.endsWith(".js"));
    if (!actionFile) return {};
    const source = fs.readFileSync(path.join(frontendRoot, "_nuxt", actionFile), "utf8");
    const names = {};
    for (const match of source.matchAll(/(?:^|,|\{)([A-Za-z0-9_]+):\{id:"([^"]+)",name:"([^"]*)"/g)) names[match[2]] = match[3];
    return names;
  } catch {
    return {};
  }
})();
const battleAreaCatalog = (() => {
  try {
    const source = fs.readFileSync(path.join(frontendRoot, "_nuxt", "game-battle-skill-I4Ckwbp2.js"), "utf8");
    const marker = "ce={";
    const markerIndex = source.indexOf(marker);
    if (markerIndex < 0) return {};
    const start = markerIndex + marker.length - 1;
    let depth = 0;
    let quote = "";
    let escaped = false;
    let end = -1;
    for (let index = start; index < source.length; index += 1) {
      const character = source[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === quote) quote = "";
        continue;
      }
      if (character === "\"" || character === "'" || character === "`") quote = character;
      else if (character === "{") depth += 1;
      else if (character === "}" && --depth === 0) {
        end = index + 1;
        break;
      }
    }
    if (end < 0) return {};
    return Function(`"use strict"; return (${source.slice(start, end)})`)();
  } catch {
    return {};
  }
})();
const itemUseEffects = (() => {
  try {
    const resourceFile = fs.readdirSync(path.join(frontendRoot, "_nuxt")).find((name) => name.startsWith("game-json-resources-") && name.endsWith(".js"));
    if (!resourceFile) return {};
    const source = fs.readFileSync(path.join(frontendRoot, "_nuxt", resourceFile), "utf8");
    const resources = [...source.matchAll(/(?:^|,)([A-Za-z0-9_]+):\{id:"([^"]+)"/g)];
    const effects = {};
    resources.forEach((match, index) => {
      const start = match.index + (match[0].startsWith(",") ? 1 : 0);
      const end = resources[index + 1]?.index ?? source.length;
      const resourceSource = source.slice(start, end);
      const effectValues = [];
      for (const effectMatch of resourceSource.matchAll(/resourceEffect:\[([^\]]*)\]/g)) {
        for (const value of effectMatch[1].matchAll(/\{resource:"([^"]+)",increase:([^,}]+)(?:,percent:([^,}]+))?/g)) {
          const increase = Number(value[2]);
          const percent = value[3] === undefined ? 1 : Number(value[3]);
          if (Number.isFinite(increase) && Number.isFinite(percent)) {
            effectValues.push({ resource: value[1], increase, percent });
          }
        }
      }
      if (effectValues.length) effects[match[2]] = effectValues;
    });
    return effects;
  } catch {
    return {};
  }
})();
const statusExperienceThresholds = [0, 20, 45, 80, 125, 180, 245, 320, 405, 500, 605, 720, 845, 980, 1125, 1280, 1445, 1620, 1805, 2000, 2205, 2420, 2645, 2880, 3125, 3380, 3645, 3920, 4205, 4500, 4805, 5760, 6825, 8000, 9285, 10680, 12185, 13800, 15525, 17360, 19305, 21360, 23525, 25800, 28185, 30680, 33285, 36000, 38825, 41760, 44805];
const statusKeys = ["attacking", "battle", "collecting", "cooking", "defencing", "dexterity", "enhance", "exploring", "farmingAnimal", "farmingPlant", "fishing", "forging", "intelligence", "knowledge", "luck", "manufacturing", "mining", "mysterious", "sewing", "stamina", "strength", "trading"];

// 参考站的等级经验是「当前等级内进度」：升到下一级需要 statusExperienceThresholds[level] 点，
// 升级时扣除该门槛并清零重算（实测：Lv.22 2536/2645 → 升到 Lv.23 后 currentExp 变为 0 起的进度）。
function normalizeStatus(status = {}) {
  const maxLevel = statusExperienceThresholds.length - 1;
  let level = Math.max(1, Math.min(maxLevel, Number(status.level) || 1));
  let exp = Math.max(0, Number(status.currentExp ?? status.exp) || 0);
  if (status.expMode !== "level") {
    // 早期版本把 currentExp 当作累计经验保存，这里一次性迁移为「等级内进度」
    level = 1;
    while (level < maxLevel && statusExperienceThresholds[level] <= exp) level += 1;
    if (level > 1) exp -= statusExperienceThresholds[level - 1];
  }
  while (level < maxLevel && exp >= statusExperienceThresholds[level]) {
    exp -= statusExperienceThresholds[level];
    level += 1;
  }
  // 战斗属性经验是小数（力量 0.28 / 耐力 0.09 等），累加会产生浮点尾巴，落盘前保留两位小数
  exp = Math.round(exp * 100) / 100;
  return { ...status, level, exp, currentExp: exp, final: level, expMode: "level" };
}

function getPlayerStatus(player) {
  return Object.fromEntries(statusKeys.map((key) => [key, normalizeStatus(player.status[key] || {})]));
}

function addStatusExp(player, key, amount) {
  const gain = Number(amount) || 0;
  if (!(gain > 0)) return normalizeStatus(player.status[key] || {});
  const base = normalizeStatus(player.status[key] || {});
  const next = normalizeStatus({ ...base, currentExp: base.currentExp + gain, exp: base.currentExp + gain });
  player.status[key] = next;
  return next;
}
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "127.0.0.1";
const configuredEmail = process.env.MAOMAO_EMAIL || "demo@example.com";
const configuredPassword = process.env.MAOMAO_PASSWORD || "change-me";
const gmPassword = process.env.MAOMAO_GM_PASSWORD || "";
const accountFile = path.resolve(process.env.MAOMAO_ACCOUNT_FILE || path.join(__dirname, "data", "accounts.json"));
const playerDataFile = path.resolve(process.env.MAOMAO_PLAYER_FILE || path.join(__dirname, "data", "players.json"));
const marketDataFile = path.resolve(process.env.MAOMAO_MARKET_FILE || path.join(__dirname, "data", "market.json"));
const localRecoveryEnabled = process.env.MAOMAO_LOCAL_RECOVERY !== "false";
const scrypt = promisify(crypto.scrypt);
const sessions = new Map();
const gmSessions = new Map();
const gmLoginAttempts = new Map();
const players = new Map();
const taskRunners = new Map();
const accounts = new Map();
const battleRooms = new Map();
const battleTimers = new Map();
const marketTrades = new Map();
const marketConfig = {
  maxSellerTransactions: 5,
  maxBuyerTransactions: 5,
  sellerSchemes: ["schemeA"],
  buyerSchemes: ["schemeA"]
};
let persistTimer = null;
let persistInProgress = false;
let persistRequested = false;

fs.mkdirSync(path.dirname(accountFile), { recursive: true });
if (fs.existsSync(accountFile)) {
  const savedAccounts = JSON.parse(fs.readFileSync(accountFile, "utf8"));
  for (const account of savedAccounts) {
    accounts.set(account.email, account);
    players.set(account.uuid, makePlayer(account.email, account.name, account.uuid, account.createdAt));
  }
}

const app = express();
const httpServer = http.createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: true, credentials: true },
  transports: ["websocket", "polling"]
});

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => {
    const index = part.indexOf("=");
    if (index < 0) return ["", ""];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function publicUser(player) {
  return {
    uuid: player.uuid,
    email: player.email,
    name: player.name,
    avatar: player.avatar,
    isIronCat: false,
    isVisitor: false
  };
}

function getPlayer(req) {
  const token = parseCookies(req.headers.cookie).maomao_session;
  const session = token && sessions.get(token);
  return session ? players.get(session.uuid) || null : getLocalRecoveryPlayer();
}

function getLocalRecoveryPlayer() {
  if (!localRecoveryEnabled || accounts.size === 0) return null;
  const configuredAccount = accounts.get(configuredEmail.trim().toLowerCase());
  const account = configuredAccount || [...accounts.values()][0];
  return players.get(account.uuid) || null;
}

function requirePlayer(req, res, next) {
  const player = getPlayer(req);
  if (!player) return res.status(401).json({ code: 401, msg: "未登录" });
  req.player = player;
  next();
}

function requireGM(req, res, next) {
  const token = parseCookies(req.headers.cookie).maomao_gm_session;
  const session = token && gmSessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (token) gmSessions.delete(token);
    return res.status(401).json({ code: 401, message: "需要管理员登录" });
  }
  session.lastSeenAt = Date.now();
  req.gmSession = session;
  next();
}

function safePlayerSummary(player) {
  return {
    uuid: player.uuid,
    email: player.email,
    name: player.name,
    createdAt: player.createdAt,
    resources: player.resources,
    inventoryCount: Object.values(player.inventory || {}).reduce((sum, item) => sum + (Number(item?.count) || 0), 0),
    taskCount: player.taskQueue?.length || 0,
    currentBattleRoomId: player.currentBattleRoomId || null
  };
}

function makePlayer(email, name, existingUuid, createdAt) {
  const uuid = existingUuid || crypto.randomUUID();
  const player = {
    uuid,
    email,
    name: name || email.split("@")[0] || "猫猫",
    avatar: "avatar_1.png",
    title: null,
    resources: { gold: 1000, food: 100 },
    inventory: { __satiety: { count: 0 } },
    status: {},
    workEquipment: {},
    battleEquipment: {},
    uniqueFlag: [],
    taskQueue: [],
    kitty: [],
    marketProfile: { extraSeller: 0, extraBuyer: 0 },
    currentBattleRoomId: null,
    battleInfo: null,
    quests: [],
    questSeq: 0,
    questWindow: 0,
    farmPlots: [],
    createdAt: createdAt || new Date().toISOString()
  };
  setGoldCount(player, 1000);
  players.set(uuid, player);
  return player;
}

function writeJsonAtomic(file, value) {
  const temporaryFile = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temporaryFile, file);
}

function playerPersistenceView(player) {
  return {
    uuid: player.uuid,
    email: player.email,
    name: player.name,
    avatar: player.avatar,
    title: player.title,
    resources: player.resources,
    inventory: player.inventory,
    status: player.status,
    workEquipment: player.workEquipment,
    battleEquipment: player.battleEquipment,
    uniqueFlag: player.uniqueFlag,
    taskQueue: player.taskQueue,
    kitty: player.kitty,
    marketProfile: player.marketProfile,
    quests: Array.isArray(player.quests) ? player.quests : [],
    questSeq: Number(player.questSeq) || 0,
    questWindow: Number(player.questWindow) || 0,
    farmPlots: Array.isArray(player.farmPlots) ? player.farmPlots : [],
    createdAt: player.createdAt
  };
}

function marketPersistenceView(trade) {
  return { ...trade };
}

function loadPersistentState() {
  try {
    if (fs.existsSync(playerDataFile)) {
      const savedPlayers = JSON.parse(fs.readFileSync(playerDataFile, "utf8"));
      for (const saved of Array.isArray(savedPlayers) ? savedPlayers : []) {
        const player = players.get(saved.uuid);
        if (!player) continue;
        Object.assign(player, {
          avatar: saved.avatar || player.avatar,
          title: saved.title ?? player.title,
          resources: saved.resources && typeof saved.resources === "object" ? saved.resources : player.resources,
          inventory: saved.inventory && typeof saved.inventory === "object" ? saved.inventory : player.inventory,
          status: saved.status && typeof saved.status === "object" ? saved.status : player.status,
          workEquipment: saved.workEquipment && typeof saved.workEquipment === "object" ? saved.workEquipment : player.workEquipment,
          battleEquipment: saved.battleEquipment && typeof saved.battleEquipment === "object" ? saved.battleEquipment : player.battleEquipment,
          uniqueFlag: Array.isArray(saved.uniqueFlag) ? saved.uniqueFlag : player.uniqueFlag,
          taskQueue: Array.isArray(saved.taskQueue) ? saved.taskQueue : player.taskQueue,
          kitty: Array.isArray(saved.kitty) ? saved.kitty : player.kitty,
          marketProfile: saved.marketProfile && typeof saved.marketProfile === "object" ? saved.marketProfile : player.marketProfile,
          quests: Array.isArray(saved.quests) ? saved.quests : player.quests,
          questSeq: Number.isFinite(Number(saved.questSeq)) ? Number(saved.questSeq) : player.questSeq,
          questWindow: Number.isFinite(Number(saved.questWindow)) ? Number(saved.questWindow) : player.questWindow,
          farmPlots: Array.isArray(saved.farmPlots) ? saved.farmPlots : player.farmPlots
        });
        if (player.inventory?.gold?.count === undefined) setGoldCount(player, player.resources?.gold || 0);
      }
    }
    if (fs.existsSync(marketDataFile)) {
      const savedTrades = JSON.parse(fs.readFileSync(marketDataFile, "utf8"));
      for (const saved of Array.isArray(savedTrades) ? savedTrades : []) {
        if (!saved?.tradeUuid || !players.has(saved.ownerUuid)) continue;
        marketTrades.set(saved.tradeUuid, saved);
      }
    }
  } catch (error) {
    console.error("failed to load persisted game state", error);
  }
}

function flushPersistedState() {
  if (persistInProgress) {
    persistRequested = true;
    return;
  }
  persistInProgress = true;
  try {
    fs.mkdirSync(path.dirname(playerDataFile), { recursive: true });
    writeJsonAtomic(playerDataFile, [...players.values()].map(playerPersistenceView));
    writeJsonAtomic(marketDataFile, [...marketTrades.values()].map(marketPersistenceView));
  } catch (error) {
    console.error("failed to persist game state", error);
  } finally {
    persistInProgress = false;
    if (persistRequested) {
      persistRequested = false;
      schedulePersist();
    }
  }
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    flushPersistedState();
  }, 50);
}

loadPersistentState();
function setSession(res, player) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { uuid: player.uuid, createdAt: Date.now() });
  res.setHeader("Set-Cookie", `maomao_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`);
  return token;
}

function sessionPayload(player) {
  return player ? { user: publicUser(player), loggedIn: true } : { user: null, loggedIn: false };
}

function ok(res, data = null, extra = {}) {
  return res.json({ code: 200, data, ...extra });
}
function marketNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function marketInteger(value, fallback = 0) {
  return Math.floor(marketNumber(value, fallback));
}

function marketData(payload) {
  let data = payload;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = {};
    }
  }
  return data?.data ?? data ?? {};
}

function getMarketProfile(player) {
  player.marketProfile ||= { extraSeller: 0, extraBuyer: 0 };
  return player.marketProfile;
}

// 金币在资源表里是一等资源（category:["Currency"]），前端背包/任务面板都从 inventory.gold.count 取数，
// 因此这里让 inventory.gold 与 resources.gold 保持同步，任一时刻两边一致。
function getAssetCount(player, resourceId) {
  if (resourceId === "gold") {
    const inventoryGold = player.inventory?.gold?.count;
    if (inventoryGold !== undefined) return Math.max(0, marketNumber(inventoryGold));
    return Math.max(0, marketNumber(player.resources?.gold));
  }
  return Math.max(0, marketNumber(player.inventory?.[resourceId]?.count));
}

function setGoldCount(player, count) {
  const amount = Math.max(0, marketNumber(count));
  player.inventory ||= {};
  player.inventory.gold = { count: amount };
  player.resources ||= {};
  player.resources.gold = amount;
}

function addAsset(player, resourceId, count) {
  const amount = marketNumber(count);
  if (amount <= 0) return;
  if (resourceId === "gold") {
    setGoldCount(player, getAssetCount(player, "gold") + amount);
    return;
  }
  player.inventory[resourceId] ||= { count: 0 };
  player.inventory[resourceId].count = marketNumber(player.inventory[resourceId].count) + amount;
}

function removeAsset(player, resourceId, count) {
  const amount = marketNumber(count);
  if (amount <= 0 || getAssetCount(player, resourceId) < amount) return false;
  if (resourceId === "gold") {
    setGoldCount(player, getAssetCount(player, "gold") - amount);
    return true;
  }
  player.inventory[resourceId].count -= amount;
  if (player.inventory[resourceId].count <= 0) delete player.inventory[resourceId];
  return true;
}

function isTradeableResource(resourceId) {
  const resource = resourceCatalog[resourceId];
  return Boolean(resource && resource.id === resourceId && !resource.isInternal && !resource.hideInMarket && resourceId !== "gold" && resourceId !== "catnip");
}

function tradeableResourceIds() {
  return Object.keys(resourceCatalog).filter(isTradeableResource);
}

function marketOrderCount(player, type) {
  return [...marketTrades.values()].filter((trade) => trade.status === "open" && trade.type === type && trade.ownerUuid === player.uuid).length;
}

function marketListingLimits(player) {
  const profile = getMarketProfile(player);
  return {
    maxSellerTransactions: marketConfig.maxSellerTransactions + profile.extraSeller,
    maxBuyerTransactions: marketConfig.maxBuyerTransactions + profile.extraBuyer,
    extraSeller: profile.extraSeller,
    extraBuyer: profile.extraBuyer,
    schemeUsageSeller: { schemeA: profile.extraSeller },
    schemeUsageBuyer: { schemeA: profile.extraBuyer },
    schemeRemainingSeller: { schemeA: "infinity" },
    schemeRemainingBuyer: { schemeA: "infinity" },
    allowedSellerSchemes: marketConfig.sellerSchemes,
    allowedBuyerSchemes: marketConfig.buyerSchemes,
    schemeRemaining: { schemeA: "infinity" },
    schemeLimitMessage: {}
  };
}

function marketTradeView(trade, viewerUuid) {
  const remaining = trade.type === "sell"
    ? Math.max(0, trade.sellResourceCount - trade.selledResourceCount)
    : Math.max(0, trade.requireResourceCount - trade.doneResourceCount);
  return {
    tradeUuid: trade.tradeUuid,
    type: trade.type,
    sellResourceId: trade.sellResourceId,
    sellResourceCount: trade.sellResourceCount,
    selledResourceCount: trade.selledResourceCount,
    requireResourceId: trade.requireResourceId,
    requireResourceCount: trade.requireResourceCount,
    doneResourceCount: trade.doneResourceCount,
    costResourceId: trade.costResourceId,
    costPerUnit: trade.costPerUnit,
    payResourceId: trade.payResourceId,
    payPerUnit: trade.payPerUnit,
    isClosed: trade.status !== "open",
    isSelf: trade.ownerUuid === viewerUuid,
    createTime: trade.createTime,
    closeTime: trade.closeTime || null,
    remainingCount: remaining
  };
}

function marketPlayerSockets(uuid) {
  return [...io.sockets.sockets.values()].filter((socket) => socket.player?.uuid === uuid);
}

function emitMarketPlayerState(uuid) {
  const player = players.get(uuid);
  if (!player) return;
  for (const socket of marketPlayerSockets(uuid)) {
    emitGameEvent(socket, "dispatchInventoryInfo", player.inventory);
    emitGameEvent(socket, "inventoryUpdated", player.inventory);
    emitGameEvent(socket, "character:getGameState:success", { resources: player.resources, inventory: player.inventory, taskQueue: player.taskQueue });
    emitGameEvent(socket, "characterInitData", { data: characterInitData(player) });
  }
}

function marketTradePriceData(resourceId) {
  const sellPrices = [...marketTrades.values()]
    .filter((trade) => trade.status === "open" && trade.type === "sell" && trade.sellResourceId === resourceId)
    .map((trade) => trade.costPerUnit)
    .filter((price) => Number.isFinite(price));
  const buyPrices = [...marketTrades.values()]
    .filter((trade) => trade.status === "open" && trade.type === "buy" && trade.requireResourceId === resourceId)
    .map((trade) => trade.payPerUnit)
    .filter((price) => Number.isFinite(price));
  const result = {};
  if (sellPrices.length) result.sellOrders = { minPrice: Math.min(...sellPrices) };
  if (buyPrices.length) result.buyOrders = { maxPrice: Math.max(...buyPrices) };
  return result;
}

function marketPricePayload(resourceId) {
  const ids = resourceId ? [resourceId] : tradeableResourceIds();
  return { items: Object.fromEntries(ids.map((id) => [id, marketTradePriceData(id)])) };
}

function marketTradeList(data, viewerUuid) {
  const type = data.type === "buy" ? "buy" : data.type === "sell" ? "sell" : null;
  const status = data.status === "open" || data.status === "closed" ? data.status : null;
  const resourceIds = new Set([
    ...(Array.isArray(data.resourceIds) ? data.resourceIds : []),
    ...(data.resourceId ? [data.resourceId] : [])
  ].filter(Boolean));
  let trades = [...marketTrades.values()].filter((trade) => {
    if (type && trade.type !== type) return false;
    if (status && (trade.status === "open" ? "open" : "closed") !== status) return false;
    if (resourceIds.size) {
      const resourceId = trade.type === "sell" ? trade.sellResourceId : trade.requireResourceId;
      if (!resourceIds.has(resourceId)) return false;
    }
    return true;
  });
  const sortBy = data.sortBy || "createTime";
  const sortOrder = data.sortOrder === "asc" ? 1 : -1;
  const sortValue = (trade) => {
    if (sortBy === "costPerUnit") return trade.type === "sell" ? trade.costPerUnit : trade.payPerUnit;
    if (sortBy === "sellResourceCount") return trade.sellResourceCount;
    if (sortBy === "requireResourceCount") return trade.requireResourceCount;
    return new Date(trade.createTime).getTime();
  };
  trades.sort((left, right) => (sortValue(left) - sortValue(right)) * sortOrder);
  const pageSize = Math.min(100, Math.max(1, marketInteger(data.pageSize, 50)));
  const page = Math.max(1, marketInteger(data.page, 1));
  const start = (page - 1) * pageSize;
  const allSell = [...marketTrades.values()].filter((trade) => trade.type === "sell").length;
  const allBuy = [...marketTrades.values()].filter((trade) => trade.type === "buy").length;
  return {
    items: trades.slice(start, start + pageSize).map((trade) => marketTradeView(trade, viewerUuid)),
    total: trades.length,
    totalSell: allSell,
    totalBuy: allBuy,
    openSellCount: [...marketTrades.values()].filter((trade) => trade.type === "sell" && trade.status === "open").length,
    openBuyCount: [...marketTrades.values()].filter((trade) => trade.type === "buy" && trade.status === "open").length,
    type,
    page,
    pageSize
  };
}

function closeMarketTrade(trade) {
  trade.status = "closed";
  trade.closeTime = new Date().toISOString();
}

function emitMarketError(socket, event, message) {
  emitGameEvent(socket, `${event}:error`, { message });
}

function handleMarketEvent(socket, event, payload) {
  const player = socket.player;
  if (!player) return true;
  const data = marketData(payload);
  schedulePersist();
  if (event === "market:getListingLimits" || event === "market:listingLimits") {
    emitGameEvent(socket, "market:listingLimits:success", marketListingLimits(player));
    return true;
  }
  if (event === "newMarket:getAllTradeableResourceList") {
    emitGameEvent(socket, `${event}:success`, tradeableResourceIds());
    return true;
  }
  if (event === "newMarket:priceData") {
    emitGameEvent(socket, `${event}:success`, { resourceId: data.resourceId, data: marketTradePriceData(data.resourceId) });
    return true;
  }
  if (event === "newMarket:getUnifiedTransactionHistory" || event === "market:getTransactionList") {
    emitGameEvent(socket, `${event}:success`, marketTradeList(data, player.uuid));
    return true;
  }
  if (event === "market:expandSellerListingSlots" || event === "market:expandBuyerListingSlots") {
    if (data.schemeId && data.schemeId !== "schemeA") return emitMarketError(socket, event, "listing scheme unavailable"), true;
    const profile = getMarketProfile(player);
    if (event.includes("Seller")) profile.extraSeller += 1;
    else profile.extraBuyer += 1;
    emitGameEvent(socket, `${event}:success`, marketListingLimits(player));
    return true;
  }
  if (event === "market:listToMarket") {
    const sellResourceId = data.sellResourceId;
    const sellResourceCount = marketInteger(data.sellResourceCount, 0);
    const costResourceId = data.costResourceId || "gold";
    const costPerUnit = marketNumber(data.costPerUnit, 0);
    if (!isTradeableResource(sellResourceId) || sellResourceCount < 1 || costPerUnit <= 0) return emitMarketError(socket, event, "invalid sell order"), true;
    if (marketOrderCount(player, "sell") >= marketListingLimits(player).maxSellerTransactions) return emitMarketError(socket, event, "seller listing limit reached"), true;
    if (getAssetCount(player, sellResourceId) < sellResourceCount) return emitMarketError(socket, event, "insufficient inventory"), true;
    if (!removeAsset(player, sellResourceId, sellResourceCount)) return emitMarketError(socket, event, "insufficient inventory"), true;
    const trade = {
      tradeUuid: crypto.randomUUID(), type: "sell", status: "open", ownerUuid: player.uuid, sellerUuid: player.uuid,
      sellResourceId, sellResourceCount, selledResourceCount: 0, requireResourceId: sellResourceId, requireResourceCount: sellResourceCount, doneResourceCount: 0,
      costResourceId, costPerUnit, payResourceId: costResourceId, payPerUnit: costPerUnit, createTime: new Date().toISOString()
    };
    marketTrades.set(trade.tradeUuid, trade);
    emitMarketPlayerState(player.uuid);
    emitGameEvent(socket, `${event}:success`, marketTradeView(trade, player.uuid));
    return true;
  }
  if (event === "market:buyFromMarket") {
    const trade = marketTrades.get(data.tradeUuid);
    const buyCount = marketInteger(data.buyCount, 0);
    if (!trade || trade.type !== "sell" || trade.status !== "open") return emitMarketError(socket, event, "sell order unavailable"), true;
    if (trade.ownerUuid === player.uuid) return emitMarketError(socket, event, "cannot buy your own order"), true;
    const remaining = trade.sellResourceCount - trade.selledResourceCount;
    if (buyCount < 1 || buyCount > remaining) return emitMarketError(socket, event, "invalid purchase count"), true;
    const total = buyCount * trade.costPerUnit;
    if (getAssetCount(player, trade.costResourceId) < total) return emitMarketError(socket, event, "insufficient payment"), true;
    if (!removeAsset(player, trade.costResourceId, total)) return emitMarketError(socket, event, "insufficient payment"), true;
    addAsset(player, trade.sellResourceId, buyCount);
    const seller = players.get(trade.ownerUuid);
    if (seller) addAsset(seller, trade.costResourceId, total);
    trade.selledResourceCount += buyCount;
    trade.doneResourceCount = trade.selledResourceCount;
    if (trade.selledResourceCount >= trade.sellResourceCount) closeMarketTrade(trade);
    emitMarketPlayerState(player.uuid);
    emitMarketPlayerState(trade.ownerUuid);
    emitGameEvent(socket, `${event}:success`, marketTradeView(trade, player.uuid));
    return true;
  }
  if (event === "market:removeFromMarket") {
    const trade = marketTrades.get(data.tradeUuid);
    if (!trade || trade.type !== "sell" || trade.status !== "open") return emitMarketError(socket, event, "sell order unavailable"), true;
    if (trade.ownerUuid !== player.uuid) return emitMarketError(socket, event, "not your sell order"), true;
    addAsset(player, trade.sellResourceId, trade.sellResourceCount - trade.selledResourceCount);
    closeMarketTrade(trade);
    emitMarketPlayerState(player.uuid);
    emitGameEvent(socket, `${event}:success`, marketTradeView(trade, player.uuid));
    return true;
  }
  if (event === "buyerMarket:listToBuyerMarket") {
    const requireResourceId = data.requireResourceId;
    const requireResourceCount = marketInteger(data.requireResourceCount, 0);
    const payResourceId = data.payResourceId || "gold";
    const payPerUnit = marketNumber(data.payPerUnit, 0);
    const escrow = requireResourceCount * payPerUnit;
    if (!isTradeableResource(requireResourceId) || requireResourceCount < 1 || payPerUnit <= 0) return emitMarketError(socket, event, "invalid buy order"), true;
    if (marketOrderCount(player, "buy") >= marketListingLimits(player).maxBuyerTransactions) return emitMarketError(socket, event, "buyer listing limit reached"), true;
    if (getAssetCount(player, payResourceId) < escrow) return emitMarketError(socket, event, "insufficient payment reserve"), true;
    if (!removeAsset(player, payResourceId, escrow)) return emitMarketError(socket, event, "insufficient payment reserve"), true;
    const trade = {
      tradeUuid: crypto.randomUUID(), type: "buy", status: "open", ownerUuid: player.uuid, buyerUuid: player.uuid,
      sellResourceId: requireResourceId, sellResourceCount: requireResourceCount, selledResourceCount: 0, requireResourceId, requireResourceCount, doneResourceCount: 0,
      costResourceId: payResourceId, costPerUnit: payPerUnit, payResourceId, payPerUnit, escrowRemaining: escrow, createTime: new Date().toISOString()
    };
    marketTrades.set(trade.tradeUuid, trade);
    emitMarketPlayerState(player.uuid);
    emitGameEvent(socket, `${event}:success`, marketTradeView(trade, player.uuid));
    return true;
  }
  if (event === "buyerMarket:sellToBuyerMarket") {
    const trade = marketTrades.get(data.tradeUuid);
    const sellCount = marketInteger(data.sellCount, 0);
    if (!trade || trade.type !== "buy" || trade.status !== "open") return emitMarketError(socket, event, "buy order unavailable"), true;
    if (trade.ownerUuid === player.uuid) return emitMarketError(socket, event, "cannot sell to your own order"), true;
    const remaining = trade.requireResourceCount - trade.doneResourceCount;
    if (sellCount < 1 || sellCount > remaining) return emitMarketError(socket, event, "invalid sale count"), true;
    if (getAssetCount(player, trade.requireResourceId) < sellCount) return emitMarketError(socket, event, "insufficient inventory"), true;
    const total = sellCount * trade.payPerUnit;
    if (!removeAsset(player, trade.requireResourceId, sellCount)) return emitMarketError(socket, event, "insufficient inventory"), true;
    addAsset(player, trade.payResourceId, total);
    const buyer = players.get(trade.ownerUuid);
    if (buyer) addAsset(buyer, trade.requireResourceId, sellCount);
    trade.doneResourceCount += sellCount;
    trade.selledResourceCount = trade.doneResourceCount;
    trade.escrowRemaining = Math.max(0, marketNumber(trade.escrowRemaining) - total);
    if (trade.doneResourceCount >= trade.requireResourceCount) closeMarketTrade(trade);
    emitMarketPlayerState(player.uuid);
    emitMarketPlayerState(trade.ownerUuid);
    emitGameEvent(socket, `${event}:success`, marketTradeView(trade, player.uuid));
    return true;
  }
  if (event === "buyerMarket:removeFromBuyerMarket") {
    const trade = marketTrades.get(data.tradeUuid);
    if (!trade || trade.type !== "buy" || trade.status !== "open") return emitMarketError(socket, event, "buy order unavailable"), true;
    if (trade.ownerUuid !== player.uuid) return emitMarketError(socket, event, "not your buy order"), true;
    if (trade.escrowRemaining > 0) addAsset(player, trade.payResourceId, trade.escrowRemaining);
    closeMarketTrade(trade);
    emitMarketPlayerState(player.uuid);
    emitGameEvent(socket, `${event}:success`, marketTradeView(trade, player.uuid));
    return true;
  }
  return false;
}

function getOrCreatePlayer(email) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = [...players.values()].find((item) => item.email === normalizedEmail);
  return existing || makePlayer(normalizedEmail);
}

function saveAccounts() {
  const temporaryFile = `${accountFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify([...accounts.values()], null, 2), { mode: 0o600 });
  fs.renameSync(temporaryFile, accountFile);
}

async function authenticate(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const account = accounts.get(normalizedEmail);
  if (account) {
    const candidate = await scrypt(String(password || ""), account.salt, 64);
    if (!crypto.timingSafeEqual(candidate, Buffer.from(account.passwordHash, "hex"))) return null;
    const player = players.get(account.uuid);
    schedulePersist();
    return player;
  }
  if (normalizedEmail !== configuredEmail.trim().toLowerCase() || password !== configuredPassword) return null;
  const player = getOrCreatePlayer(normalizedEmail);
  if (!accounts.has(normalizedEmail)) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(String(password || ""), salt, 64)).toString("hex");
    accounts.set(normalizedEmail, { uuid: player.uuid, email: normalizedEmail, name: player.name, salt, passwordHash, createdAt: player.createdAt });
    saveAccounts();
  }
  schedulePersist();
  return player;
}
app.get("/api/_auth/session", (req, res) => {
  const token = parseCookies(req.headers.cookie).maomao_session;
  const session = token && sessions.get(token);
  const player = getPlayer(req);
  if (player && (!session || !players.has(session.uuid))) setSession(res, player);
  return res.json(sessionPayload(player));
});
app.post("/api/_auth/session", async (req, res) => {
  const { email, username, password } = req.body || {};
  const player = await authenticate(email || username, password);
  if (!player) return res.status(401).json({ code: 401, msg: "邮箱或密码错误" });
  setSession(res, player);
  schedulePersist();
  return res.json(sessionPayload(player));
});
app.delete("/api/_auth/session", (req, res) => {
  const token = parseCookies(req.headers.cookie).maomao_session;
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", "maomao_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  return res.json({ user: null, loggedIn: false });
});
app.post(["/api/auth/login", "/api/login"], async (req, res) => {
  const { email, username, password } = req.body || {};
  const player = await authenticate(email || username, password);
  if (!player) return res.status(401).json({ code: 401, msg: "邮箱或密码错误" });
  setSession(res, player);
  schedulePersist();
  return res.json(sessionPayload(player));
});
app.post("/api/auth/register", async (req, res) => {
  const { nickname, email, password } = req.body || {};
  const name = typeof nickname === "string" ? nickname.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!name || [...name].length > 24) {
    return res.status(400).json({ code: 400, msg: "昵称不能为空且不能超过24个字符" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return res.status(400).json({ code: 400, msg: "请输入有效的邮箱地址" });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return res.status(400).json({ code: 400, msg: "密码长度需为8至128个字符" });
  }
  if (accounts.has(normalizedEmail) || normalizedEmail === configuredEmail.trim().toLowerCase()) {
    return res.status(409).json({ code: 409, msg: "该邮箱已注册" });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
  if (accounts.has(normalizedEmail)) return res.status(409).json({ code: 409, msg: "该邮箱已注册" });

  const player = makePlayer(normalizedEmail, name);
  accounts.set(normalizedEmail, { uuid: player.uuid, email: normalizedEmail, name, salt, passwordHash, createdAt: player.createdAt });
  try {
    saveAccounts();
  } catch (error) {
    accounts.delete(normalizedEmail);
    players.delete(player.uuid);
    throw error;
  }
  setSession(res, player);
  schedulePersist();
  return res.status(201).json(sessionPayload(player));
});
app.post("/api/gm/login", (req, res) => {
  if (!gmPassword) return res.status(503).json({ code: 503, message: "GM 后台尚未配置管理员密码" });
  const address = req.ip || req.socket.remoteAddress || "unknown";
  const attempts = gmLoginAttempts.get(address) || { count: 0, lockedUntil: 0 };
  if (attempts.lockedUntil > Date.now()) return res.status(429).json({ code: 429, message: "登录尝试过多，请稍后再试" });
  const supplied = Buffer.from(String(req.body?.password || ""));
  const expected = Buffer.from(gmPassword);
  const valid = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
  if (!valid) {
    attempts.count += 1;
    if (attempts.count >= 5) {
      attempts.count = 0;
      attempts.lockedUntil = Date.now() + 10 * 60 * 1000;
    }
    gmLoginAttempts.set(address, attempts);
    return res.status(401).json({ code: 401, message: "管理员密码错误" });
  }
  gmLoginAttempts.delete(address);
  const token = crypto.randomBytes(32).toString("hex");
  gmSessions.set(token, { createdAt: Date.now(), expiresAt: Date.now() + 8 * 60 * 60 * 1000, lastSeenAt: Date.now() });
  res.setHeader("Set-Cookie", `maomao_gm_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`);
  return res.json({ code: 200, data: { authenticated: true, expiresIn: 28800 } });
});
app.get("/api/gm/session", requireGM, (_req, res) => ok(res, { authenticated: true, expiresAt: new Date(req.gmSession.expiresAt).toISOString() }));
app.delete("/api/gm/session", requireGM, (req, res) => {
  const token = parseCookies(req.headers.cookie).maomao_gm_session;
  if (token) gmSessions.delete(token);
  res.setHeader("Set-Cookie", "maomao_gm_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict");
  return res.json({ code: 200, data: { authenticated: false } });
});
app.get("/api/gm/overview", requireGM, (_req, res) => {
  const openTrades = [...marketTrades.values()].filter((trade) => trade.status === "open");
  return ok(res, {
    playerCount: players.size,
    onlineCount: new Set([...io.sockets.sockets.values()].map((socket) => socket.player?.uuid).filter(Boolean)).size,
    openSellCount: openTrades.filter((trade) => trade.type === "sell").length,
    openBuyCount: openTrades.filter((trade) => trade.type === "buy").length
  });
});
app.get("/api/gm/players", requireGM, (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(Number(req.query.pageSize) || 25)));
  const matches = [...players.values()]
    .filter((player) => !query || [player.uuid, player.email, player.name].some((value) => String(value || "").toLowerCase().includes(query)))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  return ok(res, { items: matches.slice((page - 1) * pageSize, page * pageSize).map(safePlayerSummary), total: matches.length, page, pageSize });
});
app.get("/api/gm/players/:uuid", requireGM, (req, res) => {
  const player = players.get(req.params.uuid);
  if (!player) return res.status(404).json({ code: 404, message: "玩家不存在" });
  return ok(res, {
    ...safePlayerSummary(player),
    avatar: player.avatar,
    title: player.title,
    resources: player.resources,
    inventory: player.inventory,
    status: getPlayerStatus(player),
    taskQueue: player.taskQueue,
    kitty: player.kitty,
    marketProfile: player.marketProfile,
    battleRoom: publicBattleRoom(getBattleRoom(player.currentBattleRoomId))
  });
});
app.patch("/api/gm/players/:uuid", requireGM, (req, res) => {
  const player = players.get(req.params.uuid);
  if (!player) return res.status(404).json({ code: 404, message: "玩家不存在" });
  const body = req.body || {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name || [...name].length > 24) return res.status(400).json({ code: 400, message: "昵称长度须为 1–24 个字符" });
    player.name = name;
    const account = accounts.get(player.email);
    if (account) account.name = name;
  }
  if (body.resources !== undefined) {
    if (!body.resources || typeof body.resources !== "object" || Array.isArray(body.resources)) return res.status(400).json({ code: 400, message: "resources 格式无效" });
    for (const [resourceId, rawCount] of Object.entries(body.resources)) {
      const count = Number(rawCount);
      if (!resourceCatalog[resourceId] && !["gold", "food"].includes(resourceId)) return res.status(400).json({ code: 400, message: `未知资源：${resourceId}` });
      if (!Number.isSafeInteger(count) || count < 0) return res.status(400).json({ code: 400, message: `${resourceId} 数量必须是非负整数` });
      player.resources[resourceId] = count;
    }
  }
  if (body.inventory !== undefined) {
    if (!body.inventory || typeof body.inventory !== "object" || Array.isArray(body.inventory)) return res.status(400).json({ code: 400, message: "inventory 格式无效" });
    for (const [resourceId, rawCount] of Object.entries(body.inventory)) {
      const count = Number(rawCount);
      if (!resourceCatalog[resourceId]) return res.status(400).json({ code: 400, message: `未知物品：${resourceId}` });
      if (!Number.isSafeInteger(count) || count < 0) return res.status(400).json({ code: 400, message: `${resourceId} 数量必须是非负整数` });
      if (count === 0) delete player.inventory[resourceId];
      else player.inventory[resourceId] = { ...(player.inventory[resourceId] || {}), count };
    }
  }
  if (body.experience !== undefined) {
    if (!body.experience || typeof body.experience !== "object" || Array.isArray(body.experience)) return res.status(400).json({ code: 400, message: "experience 格式无效" });
    for (const [statusId, rawExp] of Object.entries(body.experience)) {
      if (!statusKeys.includes(statusId)) return res.status(400).json({ code: 400, message: `未知属性：${statusId}` });
      const exp = Number(rawExp);
      if (!Number.isSafeInteger(exp) || exp < 0) return res.status(400).json({ code: 400, message: `${statusId} 经验必须是非负整数` });
      player.status[statusId] = normalizeStatus({ ...player.status[statusId], currentExp: exp, exp });
    }
  }
  if (accounts.has(player.email)) saveAccounts();
  schedulePersist();
  emitMarketPlayerState(player.uuid);
  for (const socket of marketPlayerSockets(player.uuid)) {
    emitGameEvent(socket, "dispatchCharacterStatusInfo", getPlayerStatus(player));
    dispatchTaskQueue(socket);
  }
  return ok(res, { ...safePlayerSummary(player), inventory: player.inventory, status: getPlayerStatus(player) });
});
app.get("/api/gm/market", requireGM, (req, res) => {
  const status = ["open", "closed"].includes(req.query.status) ? req.query.status : null;
  const type = ["sell", "buy"].includes(req.query.type) ? req.query.type : null;
  const items = [...marketTrades.values()].filter((trade) => {
    if (status && (trade.status === "open" ? "open" : "closed") !== status) return false;
    if (type && trade.type !== type) return false;
    return true;
  }).sort((left, right) => new Date(right.createTime) - new Date(left.createTime));
  return ok(res, { items: items.slice(0, 200).map((trade) => ({ ...marketTradeView(trade, ""), ownerUuid: trade.ownerUuid, ownerName: players.get(trade.ownerUuid)?.name || "未知玩家" })) });
});
app.post("/api/gm/market/:tradeUuid/cancel", requireGM, (req, res) => {
  const trade = marketTrades.get(req.params.tradeUuid);
  if (!trade || trade.status !== "open") return res.status(404).json({ code: 404, message: "开放中的订单不存在" });
  const owner = players.get(trade.ownerUuid);
  if (owner) {
    if (trade.type === "sell") addAsset(owner, trade.sellResourceId, trade.sellResourceCount - trade.selledResourceCount);
    else if (trade.escrowRemaining > 0) addAsset(owner, trade.payResourceId, trade.escrowRemaining);
  }
  closeMarketTrade(trade);
  schedulePersist();
  if (owner) emitMarketPlayerState(owner.uuid);
  return ok(res, marketTradeView(trade, ""));
});
app.get("/api/app/version.check", (_req, res) => ok(res, { showUpdateLog: false, version: "local" }));
app.get("/api/game/user/profile", requirePlayer, (req, res) => ok(res, { ...publicUser(req.player), style: { currentAvatarBorder: null } }));
app.get("/api/game/user/batch_profile", requirePlayer, (_req, res) => ok(res, {}));
app.get("/api/game/user/online", requirePlayer, (req, res) => ok(res, { online: true, uuid: req.player.uuid }));
app.post("/api/game/user/online", requirePlayer, (req, res) => ok(res, { online: true, uuid: req.player.uuid, fp: req.body?.fp || null }));
app.post("/api/game/user/switch_account", requirePlayer, (_req, res) => ok(res, publicUser(req.player)));
app.get("/api/game/kitty/profile", requirePlayer, (req, res) => ok(res, { uuid: req.player.uuid, kitty: req.player.kitty }));
app.get("/api/game/guild/profile", requirePlayer, (req, res) => ok(res, { uuid: req.query.uuid || null, name: "猫猫村" }));
app.get("/api/game/market/price", requirePlayer, (req, res) => ok(res, marketPricePayload(req.query.resourceId || null)));
app.get("/api/game/onboarding/status", requirePlayer, (_req, res) => ok(res, { seen: true }));
app.post("/api/game/onboarding/mark-seen", requirePlayer, (_req, res) => ok(res, { seen: true }));
app.get("/api/game/sponsor/service-usage", requirePlayer, (_req, res) => ok(res, { used: 0, limit: 0 }));
app.post("/api/game/tmp_notification/get_notification_info", requirePlayer, (_req, res) => ok(res, { is_unread: false }));
app.get("/api/game/user/avatar/:avatar", (_req, res) => res.sendStatus(404));

function eventResult(event, player, payload) {
  const data = payload?.data ?? payload ?? {};
  if (event === "character:getProfile" || event === "character:getInfo") return { ...publicUser(player), resources: player.resources };
  if (event === "character:getGameState") return { resources: player.resources, inventory: player.inventory, taskQueue: player.taskQueue };
  if (event === "character:getEquipment") return data.type === "battle" ? player.battleEquipment : player.workEquipment;
  if (event === "character:getSkills") return player.skills || { baseAttack: { level: 1, order: 0 } };
  if (event === "getTaskQueue") return player.taskQueue;
  if (event === "kitty:getAll" || event === "kitty:getAllFriend") return player.kitty;
  if (event === "kitty:getAllTask") return [];
  if (event === "friend:getList" || event === "guild:getList") return [];
  if (event === "chat:getPublicChatList" || event.startsWith("chat:get")) return [];
  if (event === "worldBoss:listAvailable") return [];
  if (event === "rankingList" || event === "weeklyRankingList") return [];
  if (event === "uniqueFlag:all") return { flags: player.uniqueFlag || [] };
  if (event === "userPersonalization:get") return {};
  if (event === "homeService:status") return { active: false };
  return { accepted: true, event, data };
}

io.use((socket, next) => {
  const token = parseCookies(socket.handshake.headers.cookie).maomao_session;
  const session = token && sessions.get(token);
  socket.player = session ? players.get(session.uuid) || null : getLocalRecoveryPlayer();
  next();
});

function characterInitData(player) {
  const currentBattleRoom = getBattleRoom(player.currentBattleRoomId);
  return {
    inventory: player.inventory,
    tavern: [],
    quest: Array.isArray(player.quests) ? player.quests : [],
    kittyInfo: player.kitty,
    currentBattleRoom: publicBattleRoom(currentBattleRoom),
    battleInfo: player.battleInfo || null,
    allGameActionDurationDetail: {},
    allGameActionResourceRequirementDetail: {},
    workEquipment: player.workEquipment || {},
    battleEquipment: player.battleEquipment || {},
    skills: { baseAttack: { level: 1, order: 0 } },
    building: {},
    kittyFurniture: {},
    status: getPlayerStatus(player),
    guild: {},
    userStyle: { currentAvatarBorder: null },
    // 前端以数组消费：FarmingPlotCard 用 .some(e => e.type === "kittyHomeServiceCenter" && e.level >= 2)
    // 判断是否显示「补种」开关，5430 处用 .find(e => e.type === "catVillageMonument") 算经验加成。
    // 下发 {} 会抛 TypeError 并被 Vue 的 errorHandler 吞掉，整张田地卡片渲染成注释节点。
    villageBuildingInfo: Array.isArray(player.villageBuildingInfo) ? player.villageBuildingInfo : [],
    uniqueFlag: player.uniqueFlag,
    sponsorPoint: 0,
    kittyExpedition: {},
    lastOnlineDate: null,
    skillNodes: [],
    isBeginner: true
  };
}

function emitGameEvent(socket, event, payload) {
  socket.emit(event, JSON.stringify({ data: payload }));
}

function getBattleRoom(roomId) {
  return roomId ? battleRooms.get(roomId) : null;
}

function publicBattleRoom(room) {
  return room ? structuredClone(room) : null;
}

function emitRoomUpdate(room) {
  for (const memberId of room.memberIds) {
    const member = players.get(memberId);
    if (!member) continue;
    member.currentBattleRoomId = room.uuid;
    for (const socket of io.sockets.sockets.values()) {
      if (socket.player?.uuid === memberId) {
        emitGameEvent(socket, "battleRoom:update", publicBattleRoom(room));
      }
    }
  }
}

function emitRoomEvent(room, event, payload) {
  for (const memberId of room.memberIds) {
    for (const socket of io.sockets.sockets.values()) {
      if (socket.player?.uuid === memberId) emitGameEvent(socket, event, payload);
    }
  }
}

// ---- 战斗数值换算（对照参考站 http://111.229.73.102:8080 实测 + 官方更新日志）----
// 攻击力 = 力量 × 1.25（更新日志「每点力量提供 0.25 攻击力，仅战斗内显示加成」）+ 战斗等级 × 0.2
// 防御力 = 耐力 + 战斗等级 × 0.2
// 生命上限 = 100 + 耐力 × 5；魔法上限 = 50 + 智力 × 5
// 伤害减免 = (0.0065 × 有效防御) / (1 + 0.0065 × 有效防御)，最终伤害 = floor(伤害 × (1 - 减免))
const BATTLE_LEVEL_BONUS_PER_LEVEL = 0.2;
const STRENGTH_ATTACK_BONUS = 0.25;
const DEFENSE_REDUCTION_CONSTANT = 0.0065;
const BATTLE_ATTRIBUTE_EXP = { strength: 0.28, attacking: 0.28, dexterity: 0.185, stamina: 0.09, defencing: 0.09 };
const BATTLE_LOSE_EXP_RATIO = 0.3;

function roundOneDecimal(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function battleAttackValue(strengthLevel, battleLevel) {
  const strength = Number(strengthLevel) || 1;
  const level = Number(battleLevel) || 1;
  return roundOneDecimal(strength * (1 + STRENGTH_ATTACK_BONUS) + level * BATTLE_LEVEL_BONUS_PER_LEVEL);
}

function battleDefenceValue(staminaLevel, battleLevel) {
  const stamina = Number(staminaLevel) || 1;
  const level = Number(battleLevel) || 1;
  return roundOneDecimal(stamina + level * BATTLE_LEVEL_BONUS_PER_LEVEL);
}

function battleDamageReduction(defenceValue) {
  const defence = Math.max(0, Number(defenceValue) || 0);
  const scaled = DEFENSE_REDUCTION_CONSTANT * defence;
  return scaled / (1 + scaled);
}

function battleFinalDamage(attackValue, defenceValue) {
  const attack = Number(attackValue) || 0;
  const reduction = battleDamageReduction(defenceValue);
  return Math.max(1, Math.floor(attack * (1 - reduction)));
}

function makeBattleUnit(player) {
  const status = getPlayerStatus(player);
  const strength = status.strength?.level || 1;
  const stamina = status.stamina?.level || 1;
  const intelligence = status.intelligence?.level || 1;
  const dexterity = status.dexterity?.level || 1;
  const battleLevel = status.battle?.level || 1;
  const maxHp = 100 + stamina * 5;
  const maxMp = 50 + intelligence * 5;
  const attacking = battleAttackValue(strength, battleLevel);
  const defencing = battleDefenceValue(stamina, battleLevel);
  const battleStatus = {
    ...status,
    attacking: { level: attacking, currentExp: status.strength?.currentExp || 0 },
    defencing: { level: defencing, currentExp: status.stamina?.currentExp || 0 },
    dexterity: { level: dexterity, currentExp: status.dexterity?.currentExp || 0 },
    strength: { level: strength, currentExp: status.strength?.currentExp || 0 },
    intelligence: { level: intelligence, currentExp: status.intelligence?.currentExp || 0 },
    stamina: { level: stamina, currentExp: status.stamina?.currentExp || 0 }
  };
  return {
    uuid: player.uuid,
    id: player.uuid,
    name: player.name,
    isPlayerUnit: true,
    isPlayer: true,
    isSummoned: false,
    isBoss: false,
    level: battleLevel,
    hp: maxHp,
    maxHp,
    mp: maxMp,
    maxMp,
    tmpShield: 0,
    expReward: 0,
    status: battleStatus,
    baseStatus: structuredClone(battleStatus),
    state: {},
    skills: { baseAttack: { level: 1, order: 0 } },
    skillOrder: ["baseAttack"],
    ai: {},
    skillColddown: {},
    equipment: {},
    inventory: {},
    initialStates: [],
    affix: []
  };
}

function makeBattleInfo(room) {
  const playersInBattle = room.memberIds.map((uuid) => players.get(uuid)).filter(Boolean).map(makeBattleUnit);
  const area = battleAreaCatalog[room.area] || battleAreaCatalog.forest_001;
  const specialBattle = area?.specialBattles?.find((item) => item.every && (room.turn || 1) % item.every === 0);
  const enemyPool = specialBattle?.enemies?.length ? specialBattle.enemies : area?.enemyPool || [];
  const enemyCount = specialBattle?.enemies?.length
    ? Math.max(1, Math.min(specialBattle.maxBossNum || 1, specialBattle.enemies.length))
    : Math.max(1, Number(area?.minEnemies) || 1) + Math.floor(Math.random() * Math.max(1, (Number(area?.maxEnemies) || 3) - (Number(area?.minEnemies) || 1) + 1));
  const enemies = [];
  for (let index = 0; index < enemyCount; index += 1) {
    const weightedPool = specialBattle?.enemies?.length ? specialBattle.enemies : enemyPool;
    const totalWeight = weightedPool.reduce((sum, entry) => sum + (Number(entry.weight) || 0), 0);
    let selection = Math.random() * totalWeight;
    const chosen = weightedPool.find((entry) => (selection -= Number(entry.weight) || 0) <= 0) || weightedPool[0];
    const template = chosen && battleMonsterCatalog[chosen.id];
    if (!template) continue;
    const enemy = structuredClone(template);
    enemy.uuid = crypto.randomUUID();
    enemy.isPlayer = false;
    enemy.isPlayerUnit = false;
    enemy.isSummoned = false;
    enemy.status ||= {};
    enemy.status.attacking ||= { level: Number(enemy.attack) || 5 };
    enemy.status.defencing ||= { level: Number(enemy.defense) || 1 };
    enemy.status.strength ||= { level: 1 };
    enemy.status.dexterity ||= { level: 1 };
    enemy.status.intelligence ||= { level: 1 };
    enemy.status.stamina ||= { level: 1 };
    enemy.skills ||= { baseAttack: { level: 1, order: 0 } };
    enemy.skills.baseAttack ||= { level: 1, order: 0 };
    enemy.skills.baseAttack.order ??= 0;
    enemy.ai ||= {};
    enemy.skillColddown = {};
    enemy.equipment ||= {};
    enemy.inventory ||= {};
    enemy.state ||= {};
    enemies.push(enemy);
  }
  const members = [...playersInBattle, ...enemies];
  const turnOrder = [...members].sort((left, right) =>
    (Number(right.status?.dexterity?.level) || 1) - (Number(left.status?.dexterity?.level) || 1)
  ).map((member) => member.uuid);
  const playerIds = playersInBattle.map((member) => member.uuid);
  const enemyIds = enemies.map((member) => member.uuid);
  return {
    roomId: room.uuid,
    battleType: room.battleType,
    battleStatus: "BATTLING",
    battleId: crypto.randomUUID(),
    passedTurn: 0,
    currentTurnIndex: 0,
    turnOrder,
    extraTurnIndex: 0,
    extraTurnOnBattleBegin: [],
    thisBattleTmpOnceExtraTurnIndexList: [],
    playerGroupId: "0",
    groups: { "0": playerIds, "1": enemyIds },
    members,
    worldBossConfig: { uuidList: [] },
    area: room.area,
    turnIndex: room.turn || 1,
    battleLog: []
  };
}

function setRoomBattleState(room, status) {
  room.status = status;
  room.lastUpdateAt = Date.now();
  for (const memberId of room.memberIds) {
    const player = players.get(memberId);
    if (!player) continue;
    player.battleInfo = status === "battling" ? makeBattleInfo(room) : null;
  }
}

function pushBattleInfo(room) {
  const battleInfo = room.memberIds.map((uuid) => players.get(uuid)?.battleInfo).find(Boolean);
  if (!battleInfo) return;
  for (const memberId of room.memberIds) {
    const player = players.get(memberId);
    if (player) player.battleInfo = battleInfo;
  }
  emitRoomEvent(room, "battle:fullInfo:success", { battleInfo });
  emitRoomEvent(room, "battle:begin:success", { turnIndex: room.turn || 1 });
  startBattleTurns(room);
}

function appendBattleLog(room, type, payload) {
  const battleInfo = room.memberIds.map((uuid) => players.get(uuid)?.battleInfo).find(Boolean);
  if (!battleInfo) return;
  battleInfo.battleLog.push({ type, ...payload, timestamp: Date.now() });
  if (battleInfo.battleLog.length > 300) battleInfo.battleLog.shift();
}

function grantBattleRewards(room, battleInfo, result) {
  const expRewards = {};
  const resourceRewards = {};
  const enemies = battleInfo.members.filter((unit) => !unit.isPlayerUnit && !unit.isSummoned);
  const totalExp = enemies.reduce((sum, enemy) => sum + (Number(enemy.expReward) || 0), 0);
  const baseExp = Math.floor(totalExp / Math.max(1, room.memberIds.length));
  // 参考站：战斗失败只结算基础经验，胜利额外获得完整经验（难度加成未接入）
  const exp = result === "PLAYER_WIN"
    ? Math.max(1, baseExp)
    : Math.max(0, Math.floor(baseExp * BATTLE_LOSE_EXP_RATIO));
  // 参考站：战斗会同时给予战斗属性经验（每场固定值，攻/防与力量/耐力同步）
  const attributeGain = Number(battleInfo.passedTurn) > 0 ? BATTLE_ATTRIBUTE_EXP : null;
  for (const uuid of room.memberIds) {
    const player = players.get(uuid);
    if (!player) continue;
    const battleStatus = addStatusExp(player, "battle", exp);
    if (attributeGain) {
      for (const key of ["strength", "dexterity", "stamina"]) {
        addStatusExp(player, key, Number(attributeGain[key]) || 0);
      }
      player.status.attacking = normalizeStatus({ ...player.status.attacking, expMode: "level", level: player.status.strength.level, currentExp: player.status.strength.currentExp, exp: player.status.strength.currentExp });
      player.status.defencing = normalizeStatus({ ...player.status.defencing, expMode: "level", level: player.status.stamina.level, currentExp: player.status.stamina.currentExp, exp: player.status.stamina.currentExp });
    }
    expRewards[uuid] = { exp, status: battleStatus };
    const gained = {};
    if (result === "PLAYER_WIN") {
      for (const enemy of enemies) {
        for (const drop of enemy.drops || []) {
          if (Math.random() > Number(drop.percent ?? 0)) continue;
          const minimum = Number(drop.range?.min ?? drop.count ?? 1);
          const maximum = Number(drop.range?.max ?? drop.count ?? minimum);
          const count = Math.max(1, Math.floor(minimum + Math.random() * (maximum - minimum + 1)));
          const current = Number(player.inventory[drop.id]?.count) || 0;
          player.inventory[drop.id] = { count: current + count };
          gained[drop.id] = { count: (gained[drop.id]?.count || 0) + count };
        }
      }
    }
    resourceRewards[uuid] = gained;
    const memberSocket = [...io.sockets.sockets.values()].find((candidate) => candidate.player?.uuid === uuid);
    if (memberSocket) {
      emitGameEvent(memberSocket, "dispatchCharacterStatusInfo", characterInitData(player).status);
      emitGameEvent(memberSocket, "dispatchInventoryInfo", player.inventory);
      emitGameEvent(memberSocket, "inventoryUpdated", player.inventory);
      if (Object.keys(gained).length) emitGameEvent(memberSocket, "inventory:increase:success", gained);
    }
  }
  emitRoomEvent(room, "battle:giveExpReward:success", expRewards);
  emitRoomEvent(room, "battle:giveResourceReward:success", resourceRewards);
  emitRoomEvent(room, "battle:battleInfoDetail:success", {
    roomId: room.uuid,
    battleStatus: result,
    passedTurn: battleInfo.passedTurn,
    members: battleInfo.members.map(({ uuid, name, hp, maxHp, isPlayerUnit }) => ({ uuid, name, hp, maxHp, isPlayerUnit }))
  });
}

function beginBattleRound(room) {
  room.turn = (room.turn || 0) + 1;
  room.status = "battling";
  room.waitingForRestartTime = null;
  room.waitingForAutoStartTime = null;
  room.lastUpdateAt = Date.now();
  room.memberIds.forEach((uuid) => { room.readyMap[uuid] = false; });
  setRoomBattleState(room, "battling");
  emitRoomUpdate(room);
  emitRoomEvent(room, "battle:prepareBegin:success", { roomId: room.uuid });
  emitRoomEvent(room, "battle:prepareEnd:success", { roomId: room.uuid });
  pushBattleInfo(room);
  startBattleTurns(room);
}

function scheduleBattleRestart(room) {
  const restartDelayMs = 10e3;
  room.status = "waiting_for_restart";
  room.waitingForRestartTime = Date.now() + restartDelayMs;
  room.lastUpdateAt = Date.now();
  emitRoomUpdate(room);
  const timer = setTimeout(() => {
    battleTimers.delete(room.uuid);
    if (room.memberIds.length && room.status === "waiting_for_restart") beginBattleRound(room);
  }, restartDelayMs);
  battleTimers.set(room.uuid, timer);
}

function finishBattle(room, result) {
  const timer = battleTimers.get(room.uuid);
  if (timer) clearTimeout(timer);
  battleTimers.delete(room.uuid);
  const battleInfo = room.memberIds.map((uuid) => players.get(uuid)?.battleInfo).find(Boolean);
  if (battleInfo) {
    battleInfo.battleStatus = result;
    appendBattleLog(room, result, { battleStatus: result });
    emitRoomEvent(room, "battle:update:success", battleInfo);
    grantBattleRewards(room, battleInfo, result);
  }
  if (room.autoRestart && (result === "PLAYER_WIN" || result === "PLAYER_LOSE")) {
    scheduleBattleRestart(room);
    return;
  }
  room.status = "ended";
  room.lastUpdateAt = Date.now();
  for (const uuid of room.memberIds) {
    room.readyMap[uuid] = uuid !== room.ownerId;
    const player = players.get(uuid);
    if (player) player.battleInfo = null;
  }
  emitRoomEvent(room, "battle:end:success", { battleStatus: result, roomId: room.uuid });
  emitRoomUpdate(room);
}

function resolveBattleTurn(room) {
  const battleInfo = room.memberIds.map((uuid) => players.get(uuid)?.battleInfo).find(Boolean);
  if (!battleInfo || room.status !== "battling") return;
  const alivePlayers = battleInfo.members.filter((unit) => unit.isPlayerUnit && unit.hp > 0);
  const aliveEnemies = battleInfo.members.filter((unit) => !unit.isPlayerUnit && unit.hp > 0);
  if (!aliveEnemies.length) return finishBattle(room, "PLAYER_WIN");
  if (!alivePlayers.length) return finishBattle(room, "PLAYER_LOSE");

  let actor = null;
  for (let offset = 0; offset < battleInfo.turnOrder.length; offset += 1) {
    const index = (battleInfo.currentTurnIndex + offset) % battleInfo.turnOrder.length;
    const candidate = battleInfo.members.find((unit) => unit.uuid === battleInfo.turnOrder[index]);
    if (candidate?.hp > 0) {
      battleInfo.currentTurnIndex = index;
      actor = candidate;
      break;
    }
  }
  if (!actor) return finishBattle(room, "PLAYER_LOSE");
  const actorIsPlayer = actor.isPlayerUnit;
  const targets = actorIsPlayer ? aliveEnemies : alivePlayers;
  const target = targets[Math.floor(Math.random() * targets.length)];
  if (!target) return;
  const attack = Number(actor.status?.attacking?.level) || Number(actor.attack) || 5;
  const defense = Number(target.status?.defencing?.level) || Number(target.defense) || 0;
  // 参考站的普通攻击没有随机浮动：固定基础伤害，再按目标的防御减免结算
  const damage = battleFinalDamage(attack, defense);
  target.hp = Math.max(0, target.hp - damage);
  const source = actor.uuid;
  const damagePayload = {
    source,
    type: "skill",
    castSkillId: "baseAttack",
    target: [{ unit: target.uuid, value: damage, fDamage: damage, remainingHp: target.hp, damageType: "physical", shieldDamage: 0, causeBy: {} }],
    sourceUnitUuid: source,
    targetUnitUuidList: [target.uuid],
    damageType: "physical"
  };
  battleInfo.currentTurnIndex = (battleInfo.currentTurnIndex + 1) % Math.max(1, battleInfo.turnOrder.length);
  if (battleInfo.currentTurnIndex === 0) battleInfo.passedTurn += 1;
  // 回合开始回复：每 1 点耐力回复 0.1 生命，每 1 点智力回复 0.05 魔法（向下取整，参考站多数回合回复为 0）
  battleInfo.members.forEach((unit) => {
    if (!(unit.hp > 0)) return;
    const hpRegen = Math.floor((Number(unit.status?.stamina?.level) || 1) * 0.1);
    const mpRegen = Math.floor((Number(unit.status?.intelligence?.level) || 1) * 0.05);
    if (hpRegen > 0) unit.hp = Math.min(unit.maxHp, unit.hp + hpRegen);
    if (mpRegen > 0) unit.mp = Math.min(unit.maxMp, unit.mp + mpRegen);
    if (hpRegen > 0) emitRoomEvent(room, "battle:heal:success", { source: unit.uuid, target: unit.uuid, value: hpRegen, reason: "turnRegen" });
    if (mpRegen > 0) emitRoomEvent(room, "battle:restoreMp:success", { target: unit.uuid, value: mpRegen });
  });
  appendBattleLog(room, "damage", { ...damagePayload, damage: damagePayload.target });
  emitRoomEvent(room, "battle:turnStart:success", { source });
  emitRoomEvent(room, "battle:castSkill:success", { source, skillId: "baseAttack" });
  emitRoomEvent(room, "battle:dealDamage:success", damagePayload);
  emitRoomEvent(room, "battle:drawLine:success", { source, target: target.uuid, color: "#f56c6c" });
  emitRoomEvent(room, "battle:floatText:success", { unit: target.uuid, text: `-${damage}` });
  emitRoomEvent(room, "battle:turnEnd:success", { source });
  emitRoomEvent(room, "battle:update:success", battleInfo);

  const nextResult = battleInfo.members.some((unit) => unit.isPlayerUnit && unit.hp > 0)
    ? battleInfo.members.some((unit) => !unit.isPlayerUnit && unit.hp > 0) ? null : "PLAYER_WIN"
    : "PLAYER_LOSE";
  if (nextResult) return finishBattle(room, nextResult);
  const delay = Math.max(500, Number(room.turnDurationMs) || 1800);
  battleTimers.set(room.uuid, setTimeout(() => resolveBattleTurn(room), delay));
}

function startBattleTurns(room) {
  const timer = battleTimers.get(room.uuid);
  if (timer) clearTimeout(timer);
  battleTimers.set(room.uuid, setTimeout(() => resolveBattleTurn(room), 900));
}

function removePlayerFromBattleRoom(player, socket, { emit = true } = {}) {
  const room = getBattleRoom(player.currentBattleRoomId);
  if (!room) {
    player.currentBattleRoomId = null;
    player.battleInfo = null;
    return null;
  }
  room.memberIds = room.memberIds.filter((uuid) => uuid !== player.uuid);
  delete room.readyMap[player.uuid];
  for (const offering of room.offerings.filter((item) => item.fromUserUuid === player.uuid)) {
    player.inventory[offering.resourceId] ??= { count: 0 };
    player.inventory[offering.resourceId].count += offering.count;
  }
  room.offerings = room.offerings.filter((offering) => offering.fromUserUuid !== player.uuid);
  player.currentBattleRoomId = null;
  player.battleInfo = null;
  if (socket) {
    emitGameEvent(socket, "dispatchInventoryInfo", player.inventory);
    emitGameEvent(socket, "inventoryUpdated", player.inventory);
  }
  if (!room.memberIds.length) {
    battleRooms.delete(room.uuid);
    if (emit && socket) emitGameEvent(socket, "battleRoom:leave:success", null);
    return room;
  }
  if (room.ownerId === player.uuid) room.ownerId = room.memberIds[0];
  if (room.status === "battling") {
    room.status = "ended";
    for (const memberId of room.memberIds) players.get(memberId).battleInfo = null;
    emitRoomEvent(room, "battle:end:success", { battleStatus: "PLAYER_LOSE" });
  }
  emitRoomUpdate(room);
  if (emit && socket) emitGameEvent(socket, "battleRoom:leave:success", publicBattleRoom(room));
  return room;
}

function handleBattleRoomEvent(socket, event, data) {
  const player = socket.player;
  const fail = (message, suffix = ":error") => emitGameEvent(socket, `${event}${suffix}`, { message });
  const emitSuccess = (name, value) => emitGameEvent(socket, `${name}:success`, value);
  const room = getBattleRoom(data.roomId || player.currentBattleRoomId);

  if (event === "battleRoom:create") {
    if (player.currentBattleRoomId) return fail("请先离开当前房间");
    if (!String(data.name || "").trim()) return fail("请输入房间名称");
    const battleType = data.battleType === "worldBoss" ? "worldBoss" : "normal";
    const uuid = crypto.randomUUID();
    const memberIds = [player.uuid];
    const newRoom = {
      uuid,
      name: String(data.name).trim().slice(0, 20),
      ownerId: data.ownerId && data.ownerId === player.uuid ? data.ownerId : player.uuid,
      memberIds,
      maxMembers: 4,
      readyMap: { [player.uuid]: true },
      status: "waiting",
      battleType,
      area: data.area || "forest_001",
      difficulty: Math.max(0, Number(data.difficulty) || 0),
      isPublic: data.isPublic !== false,
      autoRestart: Boolean(data.autoRestart),
      autoStartBattle: Boolean(data.autoStartBattle),
      autoRestartDenseFogMode: Boolean(data.autoRestartDenseFogMode),
      denseFogMode: Boolean(data.denseFogMode),
      phantomUuidList: Array.isArray(data.phantomUuidList) ? data.phantomUuidList : [],
      publicBattleLoot: data.publicBattleLoot !== false,
      worldBossId: data.worldBossId || null,
      worldBossVersion: data.worldBossVersion,
      afterWin: data.afterWin || null,
      autoWorldBossBattleConf: { type: "none", config: {} },
      offerings: [],
      turn: 0,
      createdAt: Date.now(),
      lastUpdateAt: Date.now()
    };
    battleRooms.set(uuid, newRoom);
    player.currentBattleRoomId = uuid;
    emitSuccess(event, publicBattleRoom(newRoom));
    emitRoomUpdate(newRoom);
    return;
  }

  if (event === "battleRoom:list") {
    const page = Math.max(1, Math.floor(Number(data.page) || 1));
    const filtered = [...battleRooms.values()].filter((candidate) =>
      (!data.name || candidate.name.toLowerCase().includes(String(data.name).toLowerCase())) &&
      (!data.area || candidate.area === data.area) &&
      (!data.onlyWaiting || candidate.status === "waiting") &&
      (candidate.isPublic || candidate.memberIds.includes(player.uuid))
    );
    emitSuccess(event, filtered.slice((page - 1) * 20, page * 20).map(publicBattleRoom));
    return;
  }

  if (event === "battleRoom:getCurrentRoom") {
    if (!room) return fail("当前不在房间", ":error");
    emitSuccess(event, publicBattleRoom(room));
    return;
  }

  if (event === "battleRoom:join") {
    const target = getBattleRoom(data.roomId);
    if (!target || target.status !== "waiting") return fail("房间不存在或已开始");
    if (player.currentBattleRoomId) return fail("请先离开当前房间");
    if (target.memberIds.length >= target.maxMembers) return fail("房间人数已满");
    target.memberIds.push(player.uuid);
    target.readyMap[player.uuid] = false;
    player.currentBattleRoomId = target.uuid;
    emitSuccess(event, publicBattleRoom(target));
    emitRoomUpdate(target);
    return;
  }

  if (event === "battleRoom:leave" || event === "battle:leaveBattle") {
    if (!room) return fail("当前不在房间", event === "battleRoom:leave" ? ":error" : ":error");
    if (event === "battle:leaveBattle") emitSuccess(event, { roomId: room.uuid });
    removePlayerFromBattleRoom(player, socket, { emit: true });
    return;
  }

  if (!room || !room.memberIds.includes(player.uuid)) return fail("你不在该房间");

  if (event === "battleRoom:kick") {
    if (room.ownerId !== player.uuid) return fail("只有房主可以移除成员");
    const targetId = data.userUuid || data.memberUuid || data.targetUuid;
    const target = players.get(targetId);
    if (!target || targetId === player.uuid || !room.memberIds.includes(targetId)) return fail("成员不存在");
    const targetSocket = [...io.sockets.sockets.values()].find((item) => item.player?.uuid === targetId);
    target.currentBattleRoomId = room.uuid;
    removePlayerFromBattleRoom(target, targetSocket, { emit: true });
    emitSuccess(event, publicBattleRoom(room));
    return;
  }

  if (event === "battleRoom:updateReadyState") {
    if (room.status !== "waiting" && room.status !== "ended") return fail("当前无法切换准备状态", ":error");
    room.readyMap[player.uuid] = Boolean(data.ready);
    emitRoomUpdate(room);
    return;
  }

  if (event === "battleRoom:update") {
    if (room.ownerId !== player.uuid || !["waiting", "ended"].includes(room.status)) return fail("当前无法修改房间");
    const editable = ["name", "area", "isPublic", "autoRestart", "autoStartBattle", "difficulty", "denseFogMode", "autoRestartDenseFogMode", "phantomUuidList", "publicBattleLoot", "battleType", "worldBossId", "worldBossVersion", "afterWin"];
    for (const key of editable) if (data[key] !== undefined) room[key] = data[key];
    room.lastUpdateAt = Date.now();
    emitSuccess(event, publicBattleRoom(room));
    emitRoomUpdate(room);
    return;
  }

  if (event === "battleRoom:startBattle") {
    if (room.ownerId !== player.uuid) return fail("只有房主可以开始战斗", ":error");
    if (!room.memberIds.every((uuid) => room.readyMap[uuid])) return fail("所有成员准备后才能开始战斗", ":error");
    if (room.status === "battling") return fail("战斗已开始", ":error");
    beginBattleRound(room);
    emitSuccess(event, publicBattleRoom(room));
    return;
  }

  if (event === "battle:stopBattle") {
    if (room.ownerId !== player.uuid) return fail("只有房主可以结束战斗", ":error");
    if (room.status !== "battling") return fail("当前没有进行中的战斗", ":error");
    const timer = battleTimers.get(room.uuid);
    if (timer) clearTimeout(timer);
    battleTimers.delete(room.uuid);
    const battleInfo = room.memberIds.map((uuid) => players.get(uuid)?.battleInfo).find(Boolean);
    if (battleInfo) {
      battleInfo.battleStatus = "ESCAPED";
      emitRoomEvent(room, "battle:update:success", battleInfo);
      emitRoomEvent(room, "battle:end:success", { battleStatus: "ESCAPED", roomId: room.uuid });
    }
    room.status = "ended";
    room.lastUpdateAt = Date.now();
    room.memberIds.forEach((uuid) => { room.readyMap[uuid] = uuid !== room.ownerId; });
    emitSuccess(event, { roomId: room.uuid });
    room.memberIds.forEach((uuid) => { players.get(uuid).battleInfo = null; });
    emitRoomUpdate(room);
    return;
  }

  if (event === "battleRoom:reorder") {
    if (room.ownerId !== player.uuid) return fail("只有房主可以调整成员顺序");
    const requested = Array.isArray(data.newMemberUuids) ? data.newMemberUuids : [];
    room.memberIds = [...requested.filter((uuid) => room.memberIds.includes(uuid)), ...room.memberIds.filter((uuid) => !requested.includes(uuid))];
    emitSuccess(event, publicBattleRoom(room));
    emitRoomUpdate(room);
    return;
  }

  if (event === "battleRoom:setAutoWorldBossBattleConf") {
    room.autoWorldBossBattleConf = data.autoWorldBossBattleConf || { type: "none", config: {} };
    emitSuccess(event, publicBattleRoom(room));
    emitRoomUpdate(room);
    return;
  }

  if (event === "battleRoom:addOffering" || event === "battleRoom:returnOffering") {
    if (room.status !== "waiting" && room.status !== "ended") return fail("戰鬥開始後不能調整契約");
    if (event === "battleRoom:addOffering") {
      if (!data.specId || !data.resourceId || !Number.isFinite(Number(data.count)) || Number(data.count) < 1) return fail("契约参数无效");
      const count = Math.floor(Number(data.count));
      const item = player.inventory[data.resourceId];
      if (!item || Number(item.count) < count) return fail("物品数量不足");
      item.count -= count;
      room.offerings.push({ specId: data.specId, count, resourceId: data.resourceId, fromUserUuid: player.uuid, consumedCount: 0 });
      emitSuccess(event, publicBattleRoom(room));
    } else {
      const offeringIndex = room.offerings.findIndex((item) => item.specId === data.specId && item.fromUserUuid === player.uuid);
      if (offeringIndex < 0) return fail("契约不存在");
      const [offering] = room.offerings.splice(offeringIndex, 1);
      player.inventory[offering.resourceId] ??= { count: 0 };
      player.inventory[offering.resourceId].count += offering.count;
      emitSuccess(event, publicBattleRoom(room));
    }
    emitRoomUpdate(room);
    return;
  }

  if (event === "battleRoom:rewardInfo") return emitSuccess(event, {});
  if (event === "battleRoom:resetSelfBattleRewardInfo") return emitSuccess(event, {});
  if (event.startsWith("battle:") && player.battleInfo && room.status === "battling") {
    if (event === "battle:update") return emitSuccess(event, player.battleInfo);
    if (event === "battle:fullInfo") return emitSuccess(event, { battleInfo: player.battleInfo });
    if (event === "battle:battleInfoDetail") return emitSuccess(event, {});
    return emitSuccess(event, { accepted: true, roomId: room.uuid, ...data });
  }
  return false;
}

function getTaskRequirements(actionId) {
  return actionRequirements[actionId] || [];
}

function taskRequirementError(player, actionId) {
  for (const requirement of getTaskRequirements(actionId)) {
    if (getAssetCount(player, requirement.resourceId) < requirement.count) {
      return { resourceId: requirement.resourceId, required: requirement.count, available: getAssetCount(player, requirement.resourceId) };
    }
  }
  return null;
}

function consumeTaskRequirements(player, actionId) {
  const error = taskRequirementError(player, actionId);
  if (error) return error;
  for (const requirement of getTaskRequirements(actionId)) removeAsset(player, requirement.resourceId, requirement.count);
  return null;
}

function taskActionExists(actionId) {
  return Boolean(actionId && (actionDurationMs[actionId] || actionRewards[actionId] || actionImprovements[actionId] || actionRequirements[actionId]));
}

function makeTask(payload = {}) {
  const createTime = payload.createTime || Date.now();
  const suppliedDuration = Number(payload.duration);
  return {
    uuid: payload.uuid || crypto.randomUUID(),
    actionId: payload.actionId,
    repeatCount: Math.max(1, Number(payload.repeatCount) || 1),
    currentRepeat: Math.max(0, Number(payload.currentRepeat) || 0),
    createTime,
    lastSubtaskDoneTime: payload.lastSubtaskDoneTime || createTime,
    duration: Number.isFinite(suppliedDuration) && suppliedDuration > 0 ? suppliedDuration : actionDurationMs[payload.actionId] || 24e3,
    paused: Boolean(payload.paused),
    pauseReason: payload.pauseReason || null
  };
}

function dispatchTaskQueue(socket) {
  emitGameEvent(socket, "dispatchTaskQueueToClient", socket.player.taskQueue);
}

function applyActionRewards(player, actionId) {
  const gained = {};
  for (const reward of actionRewards[actionId] || []) {
    if (Math.random() > reward.percent) continue;
    const minimum = reward.count ?? reward.min ?? 1;
    const maximum = reward.count ?? reward.max ?? minimum;
    const count = Math.max(1, Math.floor(minimum + Math.random() * (maximum - minimum + 1)));
    const current = Number(player.inventory[reward.resourceId]?.count) || 0;
    player.inventory[reward.resourceId] = { count: current + count };
    gained[reward.resourceId] = { count: (gained[reward.resourceId]?.count || 0) + count };
  }
  return gained;
}

function useItem(player, itemId, multiple) {
  const count = Math.max(1, Math.floor(Number(multiple) || 1));
  const item = player.inventory[itemId];
  if (!item || (Number(item.count) || 0) < count) return { error: "物品数量不足" };
  const gained = {};
  for (let index = 0; index < count; index += 1) {
    for (const effect of itemUseEffects[itemId] || []) {
      if (Math.random() > effect.percent) continue;
      const current = Number(player.inventory[effect.resource]?.count) || 0;
      player.inventory[effect.resource] = { count: current + effect.increase };
      gained[effect.resource] = { count: (gained[effect.resource]?.count || 0) + effect.increase };
    }
  }
  item.count -= count;
  if (item.count <= 0) delete player.inventory[itemId];
  return { gained };
}

const EQUIPMENT_DECORATE_SLOTS = Array.from({ length: 9 }, (_, index) => `decorate${index + 1}`);
const EQUIPMENT_BASE_SLOTS = ["cloak", "head", "body", "arm", "leg", "foot", "leftHand", "rightHand"];
const EQUIPMENT_SLOT_IDS = [...EQUIPMENT_BASE_SLOTS, "leftHand2", "rightHand2", ...EQUIPMENT_DECORATE_SLOTS];
const EQUIPMENT_EQUIP_PARTS = [...EQUIPMENT_BASE_SLOTS, ...EQUIPMENT_DECORATE_SLOTS];

function equipmentForType(player, rawType) {
  const type = rawType === "battle" ? "battle" : "work";
  const key = type === "battle" ? "battleEquipment" : "workEquipment";
  if (!player[key] || typeof player[key] !== "object" || Array.isArray(player[key])) player[key] = {};
  for (const [slot, resourceId] of Object.entries(player[key])) {
    if (!EQUIPMENT_SLOT_IDS.includes(slot) || typeof resourceId !== "string" || !resourceCatalog[resourceId]) delete player[key][slot];
  }
  return { type, equipment: player[key] };
}

// 槽位分配：主槽按 equipPart 直接落位（同槽已占用时把旧装备退回背包）；
// 饰品（decorate1-9 共享同一候选池）落到第一个空饰品槽，全满则覆盖 equipPart 指定的槽。
// leftHand2/rightHand2 属于双持解锁槽，当前角色无对应技能节点，暂不自动分配。
function resolveEquipmentSlot(item, equipment) {
  const equipPart = String(item?.equipPart || "");
  if (!EQUIPMENT_EQUIP_PARTS.includes(equipPart)) return null;
  if (!EQUIPMENT_DECORATE_SLOTS.includes(equipPart)) return equipPart;
  return EQUIPMENT_DECORATE_SLOTS.find((slot) => !equipment[slot]) || equipPart;
}

function equipItem(player, resourceId, rawType) {
  const item = resourceCatalog[resourceId];
  if (!item || !item.equipPart) return { error: "该物品不可装备" };
  const { type, equipment } = equipmentForType(player, rawType);
  const equipmentTypes = Array.isArray(item.equipmentType) ? item.equipmentType : [];
  if (!equipmentTypes.includes(type)) return { error: `该物品不能装备到${type === "battle" ? "战斗" : "生活"}装备栏` };
  if (getAssetCount(player, resourceId) < 1) return { error: "背包中没有该装备" };
  const slot = resolveEquipmentSlot(item, equipment);
  if (!slot) return { error: "该物品没有可用装备槽位" };
  const previous = equipment[slot];
  if (previous === resourceId) return { error: "该装备已在槽位中" };
  if (!removeAsset(player, resourceId, 1)) return { error: "背包中没有该装备" };
  equipment[slot] = resourceId;
  if (previous) addAsset(player, previous, 1);
  return { type, equipment, slot, replaced: previous || null };
}

function unequipItem(player, part, rawType) {
  if (!EQUIPMENT_SLOT_IDS.includes(String(part || ""))) return { error: "装备槽位无效" };
  const { type, equipment } = equipmentForType(player, rawType);
  const resourceId = equipment[part];
  if (!resourceId) return { error: "该槽位没有装备" };
  delete equipment[part];
  addAsset(player, resourceId, 1);
  return { type, equipment, slot: part, resourceId };
}

const QUEST_WINDOW_MS = 4 * 60 * 60 * 1000;
const QUEST_ACTION_POOL = ["pickBerry", "gatherMushroom", "fishing", "pickShell", "woodcutting"];
const QUEST_SEQ_START = 37;
const QUEST_MAX_COUNT = 10;
const QUEST_REROLL_BASE_COST = 250;
const QUEST_REWARD_BASE_GOLD = 18500;
const QUEST_REWARD_GOLD_STEP = 500;

function questWindowStart(timestamp) {
  return Math.floor(timestamp / QUEST_WINDOW_MS) * QUEST_WINDOW_MS;
}

// 任务编号与会参考站一致：首条 37 次，之后每条 +1，动作在 5 个生活动作里轮转；
// 金币 18500 起每条 +500，猫爪印章每 4 条 +1。
function makeQuest(player, createdAtTimestamp) {
  const index = Math.max(0, Math.floor(Number(player.questSeq) || 0));
  player.questSeq = index + 1;
  const count = QUEST_SEQ_START + index;
  const actionId = QUEST_ACTION_POOL[index % QUEST_ACTION_POOL.length];
  const title = `${actionNames[actionId] || actionId}${count}次`;
  const gold = QUEST_REWARD_BASE_GOLD + (count - QUEST_SEQ_START) * QUEST_REWARD_GOLD_STEP;
  const stamp = 22 + Math.floor((count - QUEST_SEQ_START) / 4);
  const rewardMap = { catPawStamp: { count: stamp }, gold: { count: gold } };
  return {
    uuid: crypto.randomUUID(),
    name: title,
    title,
    description: "亲自完成生活行动即可获得奖励",
    actionId,
    targetCount: count,
    currentCount: 0,
    progress: 0,
    rewardMap,
    reward: rewardMap,
    createdAt: new Date(questWindowStart(createdAtTimestamp)).toISOString(),
    rerollCount: 0,
    completed: false,
    status: "PENDING",
    target: { actionId, count, current: 0 },
    rewards: [{ count: stamp, resourceId: "catPawStamp" }, { count: gold, resourceId: "gold" }]
  };
}

// 每 4 小时补一份新任务；窗口按 UTC 0/4/8/12/16/20 对齐，对应东八区 8/12/16/20/0/4 点。
function syncQuests(player, now = Date.now()) {
  if (!Array.isArray(player.quests)) player.quests = [];
  const currentWindow = questWindowStart(now);
  const lastWindow = Number(player.questWindow) || 0;
  if (!lastWindow) {
    player.questWindow = currentWindow;
    player.quests.push(makeQuest(player, currentWindow));
    player.quests = player.quests.slice(-QUEST_MAX_COUNT);
    return 1;
  }
  let added = 0;
  let window = lastWindow + QUEST_WINDOW_MS;
  while (window <= currentWindow && added < 6) {
    player.quests.push(makeQuest(player, window));
    player.questWindow = window;
    window += QUEST_WINDOW_MS;
    added += 1;
  }
  if (added) player.quests = player.quests.slice(-QUEST_MAX_COUNT);
  return added;
}

function advanceQuests(player, actionId) {
  const changed = [];
  if (!Array.isArray(player.quests)) return changed;
  for (const quest of player.quests) {
    if (quest?.target?.actionId !== actionId) continue;
    if (quest.status === "DONE") continue;
    const total = Math.max(1, Math.floor(Number(quest.target.count) || 1));
    const current = Math.min(total, Math.max(0, Math.floor(Number(quest.target.current) || 0)) + 1);
    quest.target.current = current;
    quest.currentCount = current;
    quest.progress = Math.min(100, Math.round((current / total) * 100));
    quest.completed = current >= total;
    quest.status = quest.completed ? "DONE" : "DOING";
    changed.push(quest);
  }
  return changed;
}

function questRewardEntries(quest) {
  const rewards = [];
  for (const entry of Array.isArray(quest?.rewards) ? quest.rewards : []) {
    const count = Math.max(0, Math.floor(Number(entry?.count) || 0));
    if (!entry?.resourceId || count <= 0) continue;
    rewards.push({ resourceId: String(entry.resourceId), count });
  }
  return rewards;
}

function claimQuest(player, questUuid) {
  const index = player.quests.findIndex((quest) => quest.uuid === questUuid);
  if (index < 0) return { error: "任务不存在" };
  if (player.quests[index].status !== "DONE") return { error: "任务尚未完成" };
  const [quest] = player.quests.splice(index, 1);
  const rewards = questRewardEntries(quest);
  for (const reward of rewards) addAsset(player, reward.resourceId, reward.count);
  return { quest, rewards };
}

function claimAllQuests(player) {
  const claimable = player.quests.filter((quest) => quest.status === "DONE");
  if (!claimable.length) return { error: "没有可领取的任务奖励" };
  player.quests = player.quests.filter((quest) => quest.status !== "DONE");
  const rewards = [];
  for (const quest of claimable) {
    for (const reward of questRewardEntries(quest)) {
      addAsset(player, reward.resourceId, reward.count);
      const existing = rewards.find((item) => item.resourceId === reward.resourceId);
      if (existing) existing.count += reward.count;
      else rewards.push({ ...reward });
    }
  }
  return { rewards, quests: claimable };
}

function rerollQuest(player, questUuid) {
  const index = player.quests.findIndex((quest) => quest.uuid === questUuid);
  if (index < 0) return { error: "任务不存在" };
  const previous = player.quests[index];
  if (previous.status === "DONE") return { error: "已完成的任务无需重随" };
  const cost = QUEST_REROLL_BASE_COST * ((Number(previous.rerollCount) || 0) + 1);
  if (getAssetCount(player, "gold") < cost) return { error: `金币不足，重随需要 ${cost} 金币` };
  removeAsset(player, "gold", cost);
  const replacement = makeQuest(player, Date.parse(previous.createdAt) || Date.now());
  replacement.createdAt = previous.createdAt;
  replacement.rerollCount = (Number(previous.rerollCount) || 0) + 1;
  player.quests[index] = replacement;
  return { newQuest: replacement, cost };
}

function deleteQuest(player, questUuid) {
  const index = player.quests.findIndex((quest) => quest.uuid === questUuid);
  if (index < 0) return { error: "任务不存在" };
  const [quest] = player.quests.splice(index, 1);
  return { quest };
}

function emitPlayerResources(socket) {
  const player = socket.player;
  emitGameEvent(socket, "dispatchInventoryInfo", player.inventory);
  emitGameEvent(socket, "inventoryUpdated", player.inventory);
  emitGameEvent(socket, "character:getGameState:success", { resources: player.resources, inventory: player.inventory, taskQueue: player.taskQueue });
}

function handleQuestEvent(socket, event, data) {
  const player = socket.player;
  if (!player) return true;
  if (event === "quest:list") {
    if (syncQuests(player)) schedulePersist();
    emitGameEvent(socket, "quest:list:success", player.quests);
    return true;
  }
  if (event === "quest:complete") {
    const result = claimQuest(player, String(data.questId || data.questUuid || ""));
    if (result.error) {
      emitGameEvent(socket, "quest:complete:error", { message: result.error });
      return true;
    }
    emitGameEvent(socket, "quest:complete:success", { rewards: result.rewards, questUuid: result.quest.uuid });
    emitGameEvent(socket, "quest:list:success", player.quests);
    emitPlayerResources(socket);
    schedulePersist();
    return true;
  }
  if (event === "quest:completeAll") {
    const result = claimAllQuests(player);
    if (result.error) {
      emitGameEvent(socket, "quest:completeAll:error", { message: result.error });
      return true;
    }
    emitGameEvent(socket, "quest:completeAll:success", { rewards: result.rewards, count: result.quests.length });
    emitGameEvent(socket, "quest:list:success", player.quests);
    emitPlayerResources(socket);
    schedulePersist();
    return true;
  }
  if (event === "quest:reroll") {
    const result = rerollQuest(player, String(data.questUuid || data.questId || ""));
    if (result.error) {
      emitGameEvent(socket, "quest:reroll:error", { message: result.error });
      return true;
    }
    emitGameEvent(socket, "quest:reroll:success", { newQuest: result.newQuest, questUuid: result.newQuest.uuid, cost: result.cost });
    emitGameEvent(socket, "quest:list:success", player.quests);
    emitPlayerResources(socket);
    schedulePersist();
    return true;
  }
  if (event === "quest:delete") {
    const result = deleteQuest(player, String(data.questUuid || data.questId || ""));
    if (result.error) {
      emitGameEvent(socket, "quest:delete:error", { message: result.error });
      return true;
    }
    emitGameEvent(socket, "quest:delete:success", { questUuid: result.quest.uuid });
    emitGameEvent(socket, "quest:list:success", player.quests);
    schedulePersist();
    return true;
  }
  return false;
}

// ── 种植（farm） ───────────────────────────────────────────────────────────────
// 契约取自前端 farm store（index-CnYosZ2K.js @427442 起）：
//   farm:plots                         -> farm:plots:success          { list: [plot] }
//   farm:plot:unlock|plant|harvest|shovel|autoReplant|create
//                                      -> farm:plot:*:success         { plot }
//   farm:plot:*:fail                   -> { msg }        ← 字段名是 msg，不是 message
// 前端按 plot.id 合并单条更新（f_()），因此 id 必须稳定；地块总数固定 9（前端 fl=9）。
// 作物/肥料配置直接复用 game-jresource 的 farmingCatalog，不另建副本。
const FARM_PLOT_COUNT = 9;
const FARM_LEVEL_KEY = "farmingPlant";
// 开垦基础成本，实际消耗 = count * min(5, plotIndex)，即第 1 块地免费。
const FARM_UNLOCK_BASE_COST = [
  { id: "gold", count: 200000 },
  { id: "wood", count: 2000 },
  { id: "stone", count: 1500 },
  { id: "nutrientEssence", count: 2500 }
];

const farmCrops = new Map((farmingCatalog?.crops || []).map((crop) => [crop.seedId, crop]));
const farmFertilizers = new Map((farmingCatalog?.fertilizers || []).map((item) => [item.id, item]));

function farmResourceName(resourceId) {
  return resourceCatalog?.[resourceId]?.name || resourceId;
}

function farmRandomInt(range = {}) {
  const min = Math.floor(Number(range.min) || 0);
  const max = Math.floor(Number(range.max) || min);
  if (max <= min) return Math.max(0, min);
  return min + Math.floor(Math.random() * (max - min + 1));
}

// 肥料效果换算与前端 Kh() 对齐：时长按 percent 连乘，异变率按 percentPoint 相加，产量按 percent 放大。
function farmPlantPlan(seedId, fertilizers) {
  const crop = farmCrops.get(seedId);
  if (!crop) return null;
  const allowed = crop.fertilizerIds?.length ? new Set(crop.fertilizerIds) : null;
  const normalized = [];
  for (const item of Array.isArray(fertilizers) ? fertilizers : []) {
    if (!item?.id) continue;
    if (allowed && !allowed.has(item.id)) continue;
    const definition = farmFertilizers.get(item.id);
    if (!definition) continue;
    const maxStacks = Math.max(1, Number(definition.maxStacks) || 1);
    normalized.push({ id: item.id, stacks: Math.min(Math.max(1, Math.floor(Number(item.stacks) || 1)), maxStacks) });
  }
  let growthSeconds = Math.max(1, Number(crop.baseGrowthSeconds) || 0);
  let mutationChance = Number(crop.baseMutationChance) || 0;
  let yieldPercent = 0;
  for (const entry of normalized) {
    for (const effect of farmFertilizers.get(entry.id)?.effects || []) {
      if (effect.type === "shortenDuration") {
        if (typeof effect.seconds === "number") growthSeconds = Math.max(1, growthSeconds - effect.seconds);
        if (typeof effect.percent === "number") growthSeconds = Math.max(1, Math.floor(growthSeconds * (1 - effect.percent)));
      } else if (effect.type === "increaseMutationChance" || effect.type === "adjustMutationChance") {
        if (typeof effect.percentPoint === "number") mutationChance += effect.percentPoint;
        if (typeof effect.multiply === "number") mutationChance *= effect.multiply;
      } else if (effect.type === "increaseYield") {
        if (typeof effect.percent === "number") yieldPercent += effect.percent;
      }
    }
  }
  return {
    crop,
    fertilizers: normalized,
    growthSeconds,
    mutationChance: Math.max(0, Math.min(1, mutationChance)),
    yieldPercent
  };
}

function farmPlantCosts(plan) {
  const merged = new Map();
  const add = (id, count) => {
    const amount = Math.floor(Number(count) || 0);
    if (!id || amount <= 0) return;
    merged.set(id, (merged.get(id) || 0) + amount);
  };
  for (const item of plan.crop.plantCost || []) add(item.id, item.count);
  for (const item of plan.fertilizers) add(item.id, item.stacks);
  return [...merged.entries()].map(([id, count]) => ({ id, count }));
}

function farmRollYields(plan) {
  const gained = {};
  const add = (id, count) => {
    const amount = Math.floor(Number(count) || 0);
    if (!id || amount <= 0) return;
    gained[id] = (gained[id] || 0) + amount;
  };
  for (const entry of plan.crop.yields || []) {
    if (Math.random() > Math.min(1, Number(entry.percent ?? 1) || 0)) continue;
    const base = entry.range ? farmRandomInt(entry.range) : Number(entry.count) || 0;
    add(entry.id, Math.round(base * (1 + plan.yieldPercent)));
  }
  for (const entry of plan.crop.mutationYields || []) {
    const chance = plan.mutationChance * (Number(entry.percent ?? 1) || 0);
    if (Math.random() > chance) continue;
    add(entry.id, entry.range ? farmRandomInt(entry.range) : Number(entry.count) || 1);
  }
  return gained;
}

function farmUnlockCost(plotIndex) {
  const multiplier = Math.min(5, Math.max(0, Math.floor(Number(plotIndex) || 0)));
  return FARM_UNLOCK_BASE_COST.map((item) => ({ id: item.id, count: Math.floor(item.count * multiplier) })).filter((item) => item.count > 0);
}

function farmEnsurePlots(player) {
  if (!Array.isArray(player.farmPlots)) player.farmPlots = [];
  return player.farmPlots;
}

function farmFindPlot(player, plotIndex) {
  const index = Math.floor(Number(plotIndex));
  if (!Number.isInteger(index)) return null;
  return farmEnsurePlots(player).find((plot) => Number(plot.plotIndex) === index) || null;
}

function farmLevel(player) {
  return normalizeStatus(player.status?.[FARM_LEVEL_KEY] || {}).level;
}

function farmAddExp(player, amount) {
  const gained = Math.floor(Number(amount) || 0);
  if (gained <= 0) return;
  const status = player.status[FARM_LEVEL_KEY] || { level: 1, exp: 0, currentExp: 0 };
  const currentExp = Number(status.currentExp ?? status.exp) || 0;
  player.status[FARM_LEVEL_KEY] = normalizeStatus({ ...status, currentExp: currentExp + gained, exp: currentExp + gained });
}

// 成熟按时间惰性结算：读列表 / 收获前把到点的 GROWING 翻成 READY。
function farmRefreshPlots(player) {
  const now = Date.now();
  let changed = false;
  for (const plot of farmEnsurePlots(player)) {
    if (plot.state !== "GROWING") continue;
    const due = Date.parse(plot.expectedHarvestAt || "");
    if (!Number.isFinite(due) || due > now) continue;
    plot.state = "READY";
    changed = true;
  }
  return changed;
}

function farmTakeCosts(player, costs) {
  const missing = costs.filter((item) => getAssetCount(player, item.id) < item.count);
  if (missing.length) return missing;
  for (const item of costs) removeAsset(player, item.id, item.count);
  return null;
}

function farmStartGrowing(plot, seedId, plan) {
  const now = Date.now();
  plot.state = "GROWING";
  plot.seedId = seedId;
  plot.fertilizers = plan.fertilizers;
  plot.yieldMultiplier = plan.yieldPercent;
  plot.mutationChance = plan.mutationChance;
  plot.plantedAt = new Date(now).toISOString();
  plot.expectedHarvestAt = new Date(now + plan.growthSeconds * 1000).toISOString();
  plot.harvestAt = now + plan.growthSeconds * 1000;
}

// 字段形状对齐参考站：空值用 "" / 0，不用 null —— 前端 PlantedAt 分支按真值判断，但保持同一形状便于比对。
function farmClearPlot(plot) {
  plot.state = "EMPTY";
  plot.seedId = "";
  plot.plantedAt = "";
  plot.expectedHarvestAt = "";
  plot.harvestAt = 0;
  plot.fertilizers = [];
  plot.yieldMultiplier = 0;
  plot.mutationChance = 0;
}

function farmSyncInventory(socket, changes) {
  emitGameEvent(socket, "dispatchInventoryInfo", socket.player.inventory);
  emitGameEvent(socket, "inventoryUpdated", socket.player.inventory);
  const payload = {};
  for (const [resourceId, delta] of Object.entries(changes || {})) {
    if (!delta) continue;
    payload[resourceId] = { count: delta };
  }
  if (Object.keys(payload).length) emitGameEvent(socket, "inventoryModify", payload);
}

function handleFarmEvent(socket, event, data) {
  const player = socket.player;
  if (!player) return true;
  farmEnsurePlots(player);
  const payload = data && typeof data === "object" ? data : {};
  const fail = (message) => {
    emitGameEvent(socket, `${event}:fail`, { msg: message });
    return true;
  };

  if (event === "farm:plots") {
    const changed = farmRefreshPlots(player);
    const area = payload.area ? String(payload.area) : "";
    const list = player.farmPlots
      .filter((plot) => !area || plot.area === area)
      .sort((left, right) => String(left.area || "").localeCompare(String(right.area || "")) || Number(left.plotIndex) - Number(right.plotIndex));
    emitGameEvent(socket, "farm:plots:success", { list });
    if (changed) schedulePersist();
    return true;
  }

  if (event === "farm:plot:unlock" || event === "farm:plot:create") {
    let plotIndex = Math.floor(Number(payload.plotIndex));
    if (!Number.isInteger(plotIndex) || plotIndex < 0) {
      if (event === "farm:plot:create") {
        const used = new Set(player.farmPlots.map((plot) => Number(plot.plotIndex)));
        plotIndex = [...Array(FARM_PLOT_COUNT).keys()].find((index) => !used.has(index)) ?? -1;
      }
    }
    if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= FARM_PLOT_COUNT) return fail("田地编号无效");
    if (farmFindPlot(player, plotIndex)) return fail("该田地已经开垦");
    const costs = farmUnlockCost(plotIndex);
    const missing = farmTakeCosts(player, costs);
    if (missing) return fail(`资源不足：${missing.map((item) => `${farmResourceName(item.id)} x${item.count}`).join("、")}`);
    const plot = {
      id: plotIndex + 1,
      area: "default",
      plotIndex,
      state: "EMPTY",
      seedId: "",
      autoReplant: false,
      plantedAt: "",
      expectedHarvestAt: "",
      harvestAt: 0,
      fertilizers: [],
      yieldMultiplier: 0,
      mutationChance: 0
    };
    player.farmPlots.push(plot);
    emitGameEvent(socket, `${event}:success`, { plot: { ...plot } });
    farmSyncInventory(socket, Object.fromEntries(costs.map((item) => [item.id, -item.count])));
    schedulePersist();
    return true;
  }

  if (event === "farm:plot:plant") {
    const plot = farmFindPlot(player, payload.plotIndex);
    if (!plot) return fail("该田地尚未开垦");
    if (plot.state === "GROWING") return fail("田地正在生长中");
    if (plot.state === "READY") return fail("作物已成熟，请先收获");
    const seedId = String(payload.seedId || "");
    const plan = farmPlantPlan(seedId, payload.fertilizers);
    if (!plan) return fail("未知的种子");
    const level = farmLevel(player);
    const required = Number(plan.crop.farmingPlantLevelRequired) || 0;
    if (level < required) return fail(`种植等级不足：需要 ${required} 级，当前 ${level} 级`);
    const costs = farmPlantCosts(plan);
    const missing = farmTakeCosts(player, costs);
    if (missing) return fail(`资源不足：${missing.map((item) => `${farmResourceName(item.id)} x${item.count}`).join("、")}`);
    farmStartGrowing(plot, seedId, plan);
    emitGameEvent(socket, "farm:plot:plant:success", { plot: { ...plot } });
    farmSyncInventory(socket, Object.fromEntries(costs.map((item) => [item.id, -item.count])));
    schedulePersist();
    return true;
  }

  if (event === "farm:plot:harvest") {
    const plot = farmFindPlot(player, payload.plotIndex);
    if (!plot) return fail("该田地尚未开垦");
    farmRefreshPlots(player);
    if (plot.state !== "READY") return fail("作物尚未成熟");
    const plan = farmPlantPlan(plot.seedId, plot.fertilizers);
    if (!plan) return fail("作物数据异常，无法收获");
    const changes = {};
    for (const [resourceId, count] of Object.entries(farmRollYields(plan))) {
      addAsset(player, resourceId, count);
      changes[resourceId] = count;
    }
    farmAddExp(player, plan.crop.farmingPlantExpGainWhenHarvest);
    // 开启补种时按原种子/肥料配置尝试续种，种子或肥料不足则只清空田地。
    const replantCosts = plot.autoReplant ? farmPlantCosts(plan) : null;
    const replantMissing = replantCosts ? farmTakeCosts(player, replantCosts) : null;
    if (replantCosts && !replantMissing) {
      for (const item of replantCosts) changes[item.id] = (changes[item.id] || 0) - item.count;
      farmStartGrowing(plot, plot.seedId, plan);
    } else {
      farmClearPlot(plot);
    }
    emitGameEvent(socket, "farm:plot:harvest:success", { plot: { ...plot } });
    farmSyncInventory(socket, changes);
    emitGameEvent(socket, "dispatchCharacterStatusInfo", characterInitData(player).status);
    schedulePersist();
    return true;
  }

  if (event === "farm:plot:shovel") {
    const plot = farmFindPlot(player, payload.plotIndex);
    if (!plot) return fail("该田地尚未开垦");
    if (plot.state === "EMPTY") return fail("该田地没有作物");
    farmClearPlot(plot);
    emitGameEvent(socket, "farm:plot:shovel:success", { plot: { ...plot } });
    schedulePersist();
    return true;
  }

  if (event === "farm:plot:autoReplant") {
    const plot = farmFindPlot(player, payload.plotIndex);
    if (!plot) return fail("该田地尚未开垦");
    plot.autoReplant = Boolean(payload.value);
    emitGameEvent(socket, "farm:plot:autoReplant:success", { plot: { ...plot } });
    schedulePersist();
    return true;
  }

  return false;
}

function applyActionImprovements(player, actionId) {
  let updated = false;
  for (const improvement of actionImprovements[actionId] || []) {
    const status = player.status[improvement.status] || { level: 1, exp: 0, currentExp: 0 };
    const currentExp = Number(status.currentExp ?? status.exp) || 0;
    player.status[improvement.status] = normalizeStatus({
      ...status,
      currentExp: currentExp + improvement.increaseExp,
      exp: currentExp + improvement.increaseExp
    });
    updated = true;
  }
  return updated;
}

function stopTaskRunner(player) {
  const runner = taskRunners.get(player.uuid);
  if (!runner) return;
  if (runner.timer) clearTimeout(runner.timer);
  taskRunners.delete(player.uuid);
}

function runTaskQueue(socket) {
  const player = socket.player;
  const runner = taskRunners.get(player.uuid);
  if (!runner) return;
  runner.timer = null;
  const task = player.taskQueue[0];
  if (!task) {
    stopTaskRunner(player);
    dispatchTaskQueue(socket);
    return;
  }
  if (task.paused) {
    runner.timer = setTimeout(() => runTaskQueue(socket), 1000);
    return;
  }
  const now = Date.now();
  if (!task.lastSubtaskDoneTime || task.lastSubtaskDoneTime > now) task.lastSubtaskDoneTime = now;
  const completionTime = task.lastSubtaskDoneTime + (Number(task.duration) || actionDurationMs[task.actionId] || 24e3);
  const remaining = completionTime - now;
  if (remaining > 0) {
    runner.timer = setTimeout(() => runTaskQueue(socket), Math.min(remaining, 1000));
    return;
  }
  const requirementError = consumeTaskRequirements(player, task.actionId);
  if (requirementError) {
    task.paused = true;
    task.pauseReason = "insufficient_resource";
    task.lastSubtaskDoneTime = now;
    emitGameEvent(socket, "taskUpdated", task);
    dispatchTaskQueue(socket);
    schedulePersist();
    runner.timer = setTimeout(() => runTaskQueue(socket), 1000);
    return;
  }
  task.currentRepeat = Math.min(task.repeatCount, task.currentRepeat + 1);
  task.lastSubtaskDoneTime = now;
  const gained = applyActionRewards(player, task.actionId);
  if (Object.keys(gained).length) {
    emitGameEvent(socket, "dispatchInventoryInfo", player.inventory);
    emitGameEvent(socket, "inventoryUpdated", player.inventory);
    emitGameEvent(socket, "inventory:increase:success", gained);
  }
  if (applyActionImprovements(player, task.actionId)) {
    emitGameEvent(socket, "dispatchCharacterStatusInfo", characterInitData(player).status);
  }
  for (const quest of advanceQuests(player, task.actionId)) emitGameEvent(socket, "quest:updated", quest);
  schedulePersist();
  if (task.currentRepeat >= task.repeatCount) {
    player.taskQueue.shift();
    emitGameEvent(socket, "taskDone", task);
    if (player.taskQueue[0]) player.taskQueue[0].lastSubtaskDoneTime = now;
  } else {
    emitGameEvent(socket, "taskUpdated", task);
  }
  dispatchTaskQueue(socket);
  if (player.taskQueue.length) {
    runner.timer = setTimeout(() => runTaskQueue(socket), 0);
  } else {
    stopTaskRunner(player);
  }
}

function startTaskRunner(socket) {
  const player = socket.player;
  if (!player) return;
  let runner = taskRunners.get(player.uuid);
  if (!runner) {
    runner = { socket, timer: null };
    taskRunners.set(player.uuid, runner);
  } else {
    runner.socket = socket;
    if (runner.timer) clearTimeout(runner.timer);
    runner.timer = null;
  }
  runTaskQueue(socket);
}

// 在线玩家每分钟巡检：跨过 4 小时档位就补一份新任务、把到点的作物翻成可收获，并推送。
setInterval(() => {
  let changed = false;
  for (const socket of io.sockets.sockets.values()) {
    const player = socket.player;
    if (!player) continue;
    if (syncQuests(player)) {
      emitGameEvent(socket, "quest:list:success", player.quests);
      changed = true;
    }
    if (farmRefreshPlots(player)) {
      emitGameEvent(socket, "farm:plots:success", { list: player.farmPlots });
      changed = true;
    }
  }
  if (changed) schedulePersist();
}, 60 * 1000);

io.on("connection", (socket) => {
  if (!socket.player) {
    emitGameEvent(socket, "authRequired", { code: 401, msg: "未登录" });
    return;
  }
  const sendCharacterInit = () => {
    if (syncQuests(socket.player)) schedulePersist();
    emitGameEvent(socket, "characterInitData", { data: characterInitData(socket.player) });
    emitGameEvent(socket, "quest:list:success", socket.player.quests);
    emitGameEvent(socket, "join-room:success", { uuid: socket.player.uuid });
    startTaskRunner(socket);
  };
  emitGameEvent(socket, "gameInited", { uuid: socket.player.uuid });
  setTimeout(() => {
    if (socket.connected) sendCharacterInit();
  }, 500);
  socket.onAny((event, payload) => {
    if (["connect", "disconnect"].includes(event)) return;
    if (event === "joinRoom") {
      sendCharacterInit();
      return;
    }
    if (["connect", "disconnect"].includes(event)) return;
    const data = payload?.data ?? payload ?? {};
    schedulePersist();
    if (event === "character:getEquipment") {
      const equipmentType = data.type === "battle" ? "battle" : "work";
      const equipment = equipmentType === "battle" ? socket.player.battleEquipment : socket.player.workEquipment;
      emitGameEvent(socket, `character:getEquipment:${equipmentType}:success`, equipment);
      return;
    }
    if (event.startsWith("market:") || event.startsWith("buyerMarket:") || event.startsWith("newMarket:")) {
      const handled = handleMarketEvent(socket, event, payload);
      if (handled !== false) return;
    }
    if (event.startsWith("battleRoom:") || event.startsWith("battle:")) {
      const handled = handleBattleRoomEvent(socket, event, data);
      if (handled !== false) return;
    }
    if (event === "task:reorder") {
      const queue = socket.player.taskQueue;
      const requestedIds = Array.isArray(data.taskUUIDs) ? data.taskUUIDs.map(String) : [];
      const currentHead = queue[0]?.uuid || "";
      if (data.headUUID && data.headUUID !== currentHead) {
        emitGameEvent(socket, "task:reorder:failed", { message: "当前任务已变化，请刷新队列" });
        return;
      }
      const byId = new Map(queue.map((task) => [task.uuid, task]));
      const expectedTailLength = Math.max(0, queue.length - 1);
      if (requestedIds.length !== expectedTailLength || requestedIds.some((uuid) => !byId.has(uuid)) || requestedIds.includes(currentHead) || new Set(requestedIds).size !== requestedIds.length) {
        emitGameEvent(socket, "task:reorder:failed", { message: "任务队列参数无效" });
        return;
      }
      socket.player.taskQueue = queue.length ? [queue[0], ...requestedIds.map((uuid) => byId.get(uuid))] : [];
      dispatchTaskQueue(socket);
      schedulePersist();
      emitGameEvent(socket, "task:reorder:success", { message: "队列排序已保存", taskQueue: socket.player.taskQueue });
      return;
    }
    if (event === "removeTaskFromQueue") {
      const taskUuid = String(data.uuid || "");
      const index = socket.player.taskQueue.findIndex((task) => task.uuid === taskUuid);
      if (index < 0) {
        emitGameEvent(socket, "removeTaskFromQueue:fail", { message: "任务不存在" });
        return;
      }
      const [removedTask] = socket.player.taskQueue.splice(index, 1);
      if (index === 0) {
        emitGameEvent(socket, "needResetCurrentActionProgress", null);
        if (socket.player.taskQueue[0]) socket.player.taskQueue[0].lastSubtaskDoneTime = Date.now();
      }
      dispatchTaskQueue(socket);
      startTaskRunner(socket);
      schedulePersist();
      emitGameEvent(socket, "removeTaskFromQueue:success", removedTask);
      return;
    }
    if (event === "task:pause" || event === "task:resume") {
      const taskUuid = String(data.uuid || socket.player.taskQueue[0]?.uuid || "");
      const task = socket.player.taskQueue.find((item) => item.uuid === taskUuid);
      if (!task) {
        emitGameEvent(socket, `${event}:failed`, { message: "任务不存在" });
        return;
      }
      task.paused = event === "task:pause";
      task.pauseReason = task.paused ? "manual" : null;
      if (!task.paused) task.lastSubtaskDoneTime = Date.now();
      dispatchTaskQueue(socket);
      startTaskRunner(socket);
      schedulePersist();
      emitGameEvent(socket, `${event}:success`, task);
      return;
    }
    if (event === "addTaskToQueue" || event === "task:immediatelyStart") {
      const failureEvent = event === "task:immediatelyStart" ? `${event}:failed` : `${event}:fail`;
      if (!data.actionId) {
        emitGameEvent(socket, failureEvent, { message: "missing action" });
        return;
      }
      if (!taskActionExists(data.actionId)) {
        emitGameEvent(socket, failureEvent, { message: "unknown action" });
        return;
      }
      const task = makeTask(data);
      if (event === "task:immediatelyStart") socket.player.taskQueue.unshift(task);
      else socket.player.taskQueue.push(task);
      dispatchTaskQueue(socket);
      startTaskRunner(socket);
      emitGameEvent(socket, event + ":success", task);
      return;
    }
    if (event === "getTaskQueue") {
      dispatchTaskQueue(socket);
      startTaskRunner(socket);
      emitGameEvent(socket, "getTaskQueue:success", socket.player.taskQueue);
      return;
    }
    if (event === "effectAction:useItem") {
      const result = useItem(socket.player, data.itemId, data.multiple);
      if (result.error) {
        emitGameEvent(socket, "effectAction:useItem:error", { message: result.error });
        return;
      }
      emitGameEvent(socket, "dispatchInventoryInfo", socket.player.inventory);
      emitGameEvent(socket, "inventoryUpdated", socket.player.inventory);
      if (Object.keys(result.gained).length) emitGameEvent(socket, "inventory:increase:success", result.gained);
      emitGameEvent(socket, "effectAction:useItem:success", { itemId: data.itemId, multiple: Math.max(1, Math.floor(Number(data.multiple) || 1)), gained: result.gained });
      return;
    }
    if (event === "effectAction:equipItem") {
      const resourceId = String(data.resourceId || "");
      const result = equipItem(socket.player, resourceId, data.type);
      if (result.error) {
        emitGameEvent(socket, "effectAction:equip:error", { message: result.error });
        return;
      }
      emitGameEvent(socket, "effectAction:equip:success", { equipment: result.equipment, info: { resourceId } });
      emitGameEvent(socket, "dispatchInventoryInfo", socket.player.inventory);
      emitGameEvent(socket, "inventoryUpdated", socket.player.inventory);
      return;
    }
    if (event === "effectAction:unequipItem") {
      const part = String(data.part || "");
      const result = unequipItem(socket.player, part, data.type);
      if (result.error) {
        emitGameEvent(socket, "effectAction:unequip:error", { message: result.error });
        return;
      }
      emitGameEvent(socket, "effectAction:unequip:success", result.equipment);
      emitGameEvent(socket, "dispatchInventoryInfo", socket.player.inventory);
      emitGameEvent(socket, "inventoryUpdated", socket.player.inventory);
      return;
    }
    if (event.startsWith("farm:") && handleFarmEvent(socket, event, data)) return;
    if (event.startsWith("quest:") && handleQuestEvent(socket, event, data)) return;
    const result = eventResult(event, socket.player, payload);
    emitGameEvent(socket, `${event}:success`, result);
  });
});

app.get("/login", (_req, res) => res.sendFile(path.join(__dirname, "login.html")));
app.use(express.static(frontendRoot, { index: "index.html", fallthrough: true }));
app.get("*splat", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/socket.io")) return next();
  return res.sendFile(path.join(frontendRoot, "index.html"));
});

function shutdown() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  flushPersistedState();
  httpServer.close(() => process.exit(0));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

httpServer.listen(port, host, () => {
  console.log(`猫猫后端 listening on http://${host}:${port}`);
  console.log(`账号由 MAOMAO_EMAIL / MAOMAO_PASSWORD 配置，当前邮箱: ${configuredEmail}`);
});




