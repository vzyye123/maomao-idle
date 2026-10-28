// 战斗技能引擎：把「技能页」里启用的技能真正接进回合结算。
//
// 数据来源是 ./skill-catalog.js（由 backend/tools/gen-skill-catalog.py 从参考站前端 bundle
// game-battle-skill-I4Ckwbp2.js 里提取）：每个技能带静态字段、一条从 effect 源码里抠出来的
// 数值算式（value）、以及它挂的状态及状态强度算式（stateValues，参考站里叫
// thisStateActuralValue）。算式用 new Function 编译后求值，所以伤害/治疗/护盾/状态强度
// 的数值与参考站同源。
//
// 状态语义照抄参考站 game-battle-state：属性类状态在挂上时直接改 status（curse 减攻防、
// atkUp 加攻…），卸下时原样还原；poison/despair 在回合开始掉血，selfHeal 在回合开始回血，
// boneShield 把接下来 3 次伤害压到 1 点，sneak 让敌人无法单体选中它，fluster 让行动对象
// 不分敌我。
//
// 少数技能的有效果写在控制流里（驱散、按目标智力追加伤害、召唤…），机械提取不到算式，
// 由下面的 SKILL_HANDLERS 手写实现；实在没有对应系统的（召唤）宁可不施放，也不空放浪费回合。
import skillCatalog from "./skill-catalog.js";

export const SKILL_EXP_TABLE = skillCatalog.expTable;
const SKILLS = skillCatalog.skills;

const SELF_STATS = ["attacking", "defencing", "strength", "stamina", "intelligence", "dexterity", "battle", "luck"];
const TARGET_STATS = SELF_STATS.map((key) => "target" + key[0].toUpperCase() + key.slice(1));
const SCOPE_KEYS = [
  ...SELF_STATS, ...TARGET_STATS,
  "level", "maxHp", "maxMp", "hp", "mp",
  "targetMaxHp", "targetHp", "targetHpLossRatio", "targetCount"
];

const compiledValues = new Map();
function compileValue(expr) {
  if (compiledValues.has(expr)) return compiledValues.get(expr);
  let fn = null;
  try {
    fn = new Function(...SCOPE_KEYS, `return (${expr});`);
  } catch {
    fn = null;
  }
  compiledValues.set(expr, fn);
  return fn;
}

export function skillDef(skillId) {
  return SKILLS[skillId] || null;
}

export function hasExecutableValue(skillId) {
  const def = SKILLS[skillId];
  return Boolean(def && def.value && compileValue(def.value));
}

function roundOne(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

// ---- 状态 ----

// 这些状态让单位本回合无法行动（参考站里是 consumeTurn 那一类）
const INCAPACITATING_STATES = new Set(["stun", "frozen", "sleep", "paralysis", "petrify", "banished"]);
// 这些状态禁止施放技能（普攻仍可）
const SILENCING_STATES = new Set(["silence", "skillSeal"]);
// 参考站里标了 isDebuff 的状态，驱散类技能按这张表判断
const DEBUFF_STATES = new Set([
  "curse", "poison", "burn", "despair", "armorBreak", "fluster", "taunt", "silence", "skillSeal",
  "stun", "frozen", "sleep", "paralysis", "petrify", "banished", "shadowStrike", "painAmplified",
  "lastWord", "dragonRoarDebuff", "fishmanSkillSource"
]);
const BUFF_STATES = new Set([
  "atkUp", "defUp", "shield", "ironWall", "astralBarrier", "sneak", "regen", "bless", "selfHeal",
  "boneShield", "demonicRage", "lastStand"
]);

const STATE_LABELS = {
  stun: "眩晕",
  frozen: "冻结",
  silence: "沉默",
  skillSeal: "禁魔",
  banished: "放逐",
  sneak: "潜行",
  shield: "护盾",
  burn: "灼烧",
  poison: "中毒",
  venom: "中毒",
  regen: "再生",
  bless: "祝福",
  ironWall: "铁壁",
  astralBarrier: "星辉结界",
  armorBreak: "破甲",
  fluster: "慌乱",
  dragonRoarDebuff: "龙威",
  atkUp: "攻击提升",
  atkDown: "攻击下降",
  defUp: "防御提升",
  defDown: "防御下降",
  curse: "诅咒",
  boneShield: "骨盾",
  demonicRage: "恶魔狂怒",
  despair: "绝望",
  painAmplified: "痛苦放大",
  selfHeal: "自我疗愈",
  lastWord: "遗言",
  taunt: "嘲讽"
};

export function stateLabel(stateId) {
  return STATE_LABELS[stateId] || stateId;
}

// 状态语义表：挂着的时候改什么、卸下的时候还原什么（数值都取自参考站的状态定义）
const STATE_DEFS = {
  // 属性类：stat 是「每点状态强度对应的属性增减」
  atkUp: { stat: { attacking: 1 } },
  atkDown: { stat: { attacking: -1 } },
  defUp: { stat: { defencing: 1 } },
  defDown: { stat: { defencing: -1 } },
  curse: { stat: { attacking: -1, defencing: -1 }, defaultValue: 6 },
  ironWall: { stat: { defencing: 1 }, defaultValue: 5 },
  astralBarrier: { stat: { defencing: 1 }, defaultValue: 10 },
  boneShield: { stat: { defencing: 1 }, defaultValue: 8, damageCapTimes: 3 },
  demonicRage: { stat: { attacking: 1 }, zeroDefence: true, defaultValue: 100 },
  // 回合开始掉血 / 回血
  poison: { turnStartDamage: true },
  burn: { turnStartDamage: true },
  venom: { turnStartDamage: true },
  despair: { turnStartPercentMaxHp: 0.05 },
  regen: { turnStartHeal: true },
  selfHeal: { turnStartHealFromCaster: true },
  // 行为类
  sneak: { untargetable: true },
  fluster: { confused: true },
  taunt: { taunt: true },
  shield: {}
};

function stateEntries(unit) {
  return unit && unit.state && typeof unit.state === "object" ? Object.entries(unit.state) : [];
}

export function isIncapacitated(unit) {
  return stateEntries(unit).some(([id, value]) => value && INCAPACITATING_STATES.has(id));
}

export function isSilenced(unit) {
  return stateEntries(unit).some(([id, value]) => value && SILENCING_STATES.has(id));
}

export function isUntargetable(unit) {
  return Boolean(unit?.state?.sneak);
}

export function isConfused(unit) {
  return Boolean(unit?.state?.fluster);
}

export function tauntSources(units) {
  return (units || []).filter((unit) => unit?.state?.taunt && unit.hp > 0);
}

export function hasState(unit, stateId) {
  return Boolean(unit?.state?.[stateId]);
}

export function isDebuffState(stateId) {
  return DEBUFF_STATES.has(stateId);
}

function statBucket(unit, key) {
  if (!unit.status || typeof unit.status !== "object") unit.status = {};
  if (!unit.status[key] || typeof unit.status[key] !== "object") unit.status[key] = { level: 1 };
  return unit.status[key];
}

function applyStateAttach(unit, stateId, record) {
  const def = STATE_DEFS[stateId];
  if (!def) return;
  record.appliedStats = {};
  if (def.stat) {
    const strength = Number(record.actualValue ?? def.defaultValue ?? 0) || 0;
    for (const [key, sign] of Object.entries(def.stat)) {
      if (!strength) continue;
      const bucket = statBucket(unit, key);
      bucket.level = roundOne(Number(bucket.level) + sign * strength);
      record.appliedStats[key] = sign * strength;
    }
  }
  if (def.zeroDefence) {
    const bucket = statBucket(unit, "defencing");
    const current = Number(bucket.level) || 0;
    if (current) {
      bucket.level = 0;
      record.appliedStats.defencing = (record.appliedStats.defencing || 0) - current;
    }
  }
  if (def.damageCapTimes) record.remainingTimes = def.damageCapTimes;
}

function applyStateDetach(unit, stateId, record) {
  const def = STATE_DEFS[stateId];
  if (!def) return;
  for (const [key, delta] of Object.entries(record.appliedStats || {})) {
    const bucket = statBucket(unit, key);
    bucket.level = roundOne(Number(bucket.level) - Number(delta));
  }
  record.appliedStats = {};
}

/**
 * 回合开始给单位结算状态：剩余回合 -1，到 0 就摘掉（摘掉时把属性还原）。
 * 返回被摘掉的状态 id，供调用方决定是否推送事件。
 */
export function tickStates(unit) {
  const expired = [];
  for (const [id, value] of stateEntries(unit)) {
    if (!value || typeof value !== "object") {
      delete unit.state[id];
      expired.push(id);
      continue;
    }
    const remaining = Number(value.remainingDuration);
    if (!Number.isFinite(remaining)) continue;
    const next = remaining - 1;
    if (next <= 0) {
      applyStateDetach(unit, id, value);
      delete unit.state[id];
      expired.push(id);
    } else {
      value.remainingDuration = next;
    }
  }
  return expired;
}

/**
 * 给单位挂状态。同 id 只刷新剩余回合，不重复叠加属性（参考站也是这个语义：
 * 重复上同一个 buff 只延长持续时间，不会叠两层攻击力）。
 */
export function addUnitState(unit, stateId, duration, extra = {}) {
  if (!unit || !stateId) return false;
  unit.state = unit.state || {};
  const previous = unit.state[stateId];
  const remaining = Math.max(1, Math.floor(Number(duration) || 1));
  const record = {
    id: stateId,
    name: stateLabel(stateId),
    remainingDuration: previous ? Math.max(Number(previous.remainingDuration) || 0, remaining) : remaining,
    duration: Math.max(remaining, Number(previous?.duration) || 0),
    stack: (Number(previous?.stack) || 0) + (Number(extra.stack) || 1),
    ...extra
  };
  if (record.actualValue === undefined && previous?.actualValue !== undefined) {
    record.actualValue = previous.actualValue;
  }
  if (record.actualValue === undefined) {
    const fallback = STATE_DEFS[stateId]?.defaultValue;
    if (fallback !== undefined) record.actualValue = fallback;
  }
  unit.state[stateId] = record;
  if (!previous) applyStateAttach(unit, stateId, record);
  else record.appliedStats = previous.appliedStats || {};
  // 骨盾这类「有次数上限」的状态重新施加时补满次数
  if (previous && STATE_DEFS[stateId]?.damageCapTimes) {
    record.remainingTimes = STATE_DEFS[stateId].damageCapTimes;
  }
  return true;
}

/**
 * 回合开始的状态结算（掉血 / 回血）。直接改 hp，返回需要推送的事件列表。
 * ctx.members 用来找状态施加者（自我疗愈要按施放者的智力和技能等级回血）。
 */
export function applyStateTurnStart(unit, ctx = {}) {
  const out = { damage: [], heal: [] };
  if (!unit || !(unit.hp > 0)) return out;
  const members = ctx.members || [];
  for (const [id, record] of stateEntries(unit)) {
    const def = STATE_DEFS[id];
    if (!def) continue;
    if (def.turnStartDamage) {
      const value = Math.max(0, Math.floor(Number(record.actualValue) || 0));
      if (value <= 0) continue;
      unit.hp = Math.max(0, unit.hp - value);
      out.damage.push({ unit: unit.uuid, value, stateId: id, damageType: "magical", sourceUnitUuid: record.sourceUnitUuid });
    }
    if (def.turnStartPercentMaxHp) {
      const value = Math.max(1, Math.floor((Number(unit.maxHp) || 0) * def.turnStartPercentMaxHp));
      unit.hp = Math.max(0, unit.hp - value);
      out.damage.push({ unit: unit.uuid, value, stateId: id, damageType: "magical", sourceUnitUuid: record.sourceUnitUuid });
    }
    if (def.turnStartHeal) {
      const value = Math.max(0, Math.floor(Number(record.actualValue) || 0));
      if (value <= 0) continue;
      const before = unit.hp;
      unit.hp = Math.min(Number(unit.maxHp) || 0, unit.hp + value);
      if (unit.hp > before) out.heal.push({ unit: unit.uuid, value: unit.hp - before, stateId: id });
    }
    if (def.turnStartHealFromCaster) {
      const caster = members.find((item) => item.uuid === record.sourceUnitUuid) || unit;
      const intelligence = Number(caster.status?.intelligence?.level) || 1;
      const skillLevel = Math.max(1, Number(caster.skills?.[id]?.level) || 1);
      const value = Math.round(5 + 0.3 * intelligence + 4 * skillLevel);
      const before = unit.hp;
      unit.hp = Math.min(Number(unit.maxHp) || 0, unit.hp + value);
      if (unit.hp > before) out.heal.push({ unit: unit.uuid, value: unit.hp - before, stateId: id });
    }
  }
  return out;
}

/**
 * 受伤统一入口：骨盾的把伤害压到 1 点 → 护盾吸收 → 扣血。
 * 技能伤害和普攻都必须走这里，否则骨盾/护盾在其中一条链路上不生效。
 */
export function applyIncomingDamage(target, damage) {
  let incoming = Math.max(0, Math.floor(Number(damage) || 0));
  const bone = target?.state?.boneShield;
  let cappedByBoneShield = false;
  if (bone && (Number(bone.remainingTimes) || 0) > 0) {
    incoming = Math.min(incoming, 1);
    bone.remainingTimes = Math.max(0, (Number(bone.remainingTimes) || 0) - 1);
    cappedByBoneShield = true;
  }
  const shield = Math.max(0, Number(target.tmpShield) || 0);
  const absorbed = Math.min(shield, incoming);
  if (shield > 0) target.tmpShield = shield - absorbed;
  const rest = Math.max(0, incoming - absorbed);
  target.hp = Math.max(0, (Number(target.hp) || 0) - rest);
  return { damage: rest, absorbedByShield: absorbed, cappedByBoneShield };
}

// ---- 目标选择 ----

function pickRandom(list) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

// 潜行的单位不能被敌人单体选中；全员都潜行时（参考站也这样）退回全体随机
function visibleTargets(list) {
  const solid = list.filter((unit) => unit.hp > 0 && !isUntargetable(unit));
  return solid.length ? solid : list.filter((unit) => unit.hp > 0);
}

export function pickTargets(def, unit, ctx) {
  const enemies = visibleTargets(ctx.enemies || []);
  const allies = (ctx.allies || []).filter((item) => item.hp > 0);
  const count = Math.max(1, Number(def.targetCount) || 1);
  switch (def.target) {
    case "self":
      return [unit];
    case "all_ally":
    case "each_allies":
      return allies;
    case "single_random_ally":
    case "single_ally": {
      const target = pickRandom(allies);
      return target ? [target] : [];
    }
    case "all_enemy":
      return ctx.enemies.filter((item) => item.hp > 0);
    case "multi_random_enemy": {
      const targets = [];
      for (let index = 0; index < count; index += 1) {
        const target = pickRandom(enemies);
        if (target) targets.push(target);
      }
      return targets;
    }
    case "single_enemy":
    case "single_random_enemy":
    default: {
      const target = pickRandom(enemies);
      return target ? [target] : [];
    }
  }
}

// ---- 自动释放逻辑（技能页「调整自动释放逻辑」里配的条件组）----
// 结构是「条件组数组」：组间 OR、组内 AND；空数组表示不限制（默认总是尝试）。

function percentOrNumber(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  if (text.endsWith("%")) {
    const value = Number(text.slice(0, -1));
    return Number.isFinite(value) ? value / 100 : null;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function compareValues(actual, action, expected) {
  switch (action) {
    case "smallThan":
      return actual < expected;
    case "smallEqualThan":
      return actual <= expected;
    case "largeThan":
      return actual > expected;
    case "largeEqualThan":
      return actual >= expected;
    case "equalThan":
      return actual === expected;
    default:
      return true;
  }
}

function conditionValue(condition, unit, ctx) {
  const scope = String(condition.target || "self");
  const list = scope === "self"
    ? [unit]
    : scope.startsWith("enem")
      ? (ctx.enemies || []).filter((item) => item.hp > 0)
      : (ctx.allies || []).filter((item) => item.hp > 0);
  if (!list.length) return null;
  const dataType = String(condition.dataType || "hp");
  // 百分比型指标取集合里最差的那个（血量最低 / 蓝量最低），更贴近「有人快死了才放治疗」
  if (dataType === "hp") {
    return Math.min(...list.map((item) => (item.maxHp > 0 ? item.hp / item.maxHp : 0)));
  }
  if (dataType === "mp") {
    return Math.min(...list.map((item) => (item.maxMp > 0 ? item.mp / item.maxMp : 0)));
  }
  if (dataType === "lostHp") {
    return Math.max(...list.map((item) => Math.max(0, item.maxHp - item.hp)));
  }
  if (dataType === "lostMp") {
    return Math.max(...list.map((item) => Math.max(0, item.maxMp - item.mp)));
  }
  if (dataType === "count") return list.length;
  if (dataType === "passedTurn") return Number(ctx.passedTurn) || 0;
  return null;
}

function evalCondition(condition, unit, ctx) {
  if (!condition || typeof condition !== "object") return true;
  if (condition.compareType === "state") {
    const stateId = condition.stateCompareStateId;
    const scope = String(condition.target || "self");
    const list = scope === "self"
      ? [unit]
      : scope.startsWith("enem")
        ? (ctx.enemies || []).filter((item) => item.hp > 0)
        : (ctx.allies || []).filter((item) => item.hp > 0);
    if (!stateId || !list.length) return true;
    const has = list.map((item) => Boolean(item.state?.[stateId]));
    switch (condition.stateCompareAction) {
      case "someoneHasState":
        return has.some(Boolean);
      case "allHasState":
        return has.every(Boolean);
      case "someoneNotHasState":
        return has.some((flag) => !flag);
      case "allNotHasState":
        return has.every((flag) => !flag);
      default:
        return true;
    }
  }
  const expected = percentOrNumber(condition.valueConditionValue);
  if (expected === null) return true;
  const actual = conditionValue(condition, unit, ctx);
  if (actual === null) return true;
  return compareValues(actual, condition.valueCompareAction, expected);
}

export function evalSkillLogic(logic, unit, ctx) {
  if (!Array.isArray(logic) || !logic.length) return true;
  const groups = Array.isArray(logic[0]) ? logic : [logic];
  return groups.some((group) => Array.isArray(group) && group.length && group.every((cond) => evalCondition(cond, unit, ctx)));
}

// ---- 选技能 ----

// 召唤系统没做（战斗成员在开局就固定了），这两个技能放了也没有实体可加，
// 与其空放浪费一回合，不如退回普攻。
const SKIP_CAST = new Set(["clownSummon", "mirrorImage"]);

function isCastable(def) {
  if (def.neverCast || SKIP_CAST.has(def.id)) return false;
  if (def.value) return Boolean(compileValue(def.value));
  if (Array.isArray(def.stateValues) && def.stateValues.length) return true;
  return Boolean(SKILL_HANDLERS[def.id]);
}

/**
 * 按技能页里的顺序找第一个能放的技能。
 * 返回 { skill, targets } 或 null（null 表示这一回合走普通攻击）。
 */
export function selectSkill(unit, ctx) {
  if (!unit || isIncapacitated(unit)) return null;
  if (isSilenced(unit)) return null;
  const order = Array.isArray(unit.skillOrder) && unit.skillOrder.length
    ? unit.skillOrder
    : Object.keys(unit.skills || {});
  for (const skillId of order) {
    if (skillId === "baseAttack") continue;
    const def = SKILLS[skillId];
    if (!def || !isCastable(def)) continue;
    const state = unit.skills?.[skillId];
    if (!state || state.enabled === false) continue;
    if ((Number(unit.skillColddown?.[skillId]) || 0) > 0) continue;
    if ((Number(unit.mp) || 0) < (Number(def.mpCost) || 0)) continue;
    const targets = pickTargets(def, unit, ctx);
    if (!targets.length) continue;
    if (!evalSkillLogic(unit.skillLogic?.[skillId], unit, ctx)) continue;
    return { skill: def, targets };
  }
  return null;
}

// ---- 结算 ----

function unitStat(unit, key) {
  const value = unit?.status?.[key]?.level;
  return Number(value) || (Number(unit?.[key]) || 1);
}

function valueScope(unit, target, level, targetCount) {
  const scope = {
    level,
    maxHp: Number(unit.maxHp) || 0,
    maxMp: Number(unit.maxMp) || 0,
    hp: Number(unit.hp) || 0,
    mp: Number(unit.mp) || 0,
    targetMaxHp: Number(target?.maxHp) || 0,
    targetHp: Number(target?.hp) || 0,
    targetHpLossRatio: target && target.maxHp > 0 ? Math.max(0, Math.min(1, (target.maxHp - target.hp) / target.maxHp)) : 0,
    targetCount
  };
  for (const key of SELF_STATS) scope[key] = unitStat(unit, key);
  for (const key of SELF_STATS) scope["target" + key[0].toUpperCase() + key.slice(1)] = unitStat(target, key);
  return scope;
}

/** 求值一条技能算式（value / stateValues 通用）。 */
export function evalSkillExpr(unit, expr, target, targetCount = 1, skillId = null) {
  const fn = compileValue(expr);
  if (!fn) return 0;
  const id = skillId || expr;
  const level = Math.max(1, Math.floor(Number(unit.skills?.[id]?.level) || 1));
  const scope = valueScope(unit, target, level, targetCount);
  try {
    const raw = fn(...SCOPE_KEYS.map((key) => scope[key]));
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  } catch {
    return 0;
  }
}

export function skillRawValue(unit, skill, target, targetCount = 1) {
  return evalSkillExpr(unit, skill.value, target, targetCount, skill.id);
}

// ---- 手写技能（有效果藏在控制流里，机械提取不到算式）----

function hasAnyState(unit, family) {
  return stateEntries(unit).some(([id, value]) => value && family.has(id));
}

function damageEntry(raw, extra = {}) {
  return { raw: Math.max(0, Math.floor(Number(raw) || 0)), ...extra };
}

const SKILL_HANDLERS = {
  // 为随机一名有负面状态的友方移除所有可驱散的负面状态
  cleanse(unit, skill, targets, helpers, ctx) {
    const allies = (ctx.allies || []).filter((item) => item.hp > 0 && hasAnyState(item, DEBUFF_STATES));
    const target = pickRandom(allies);
    if (!target) return { skipCast: true };
    const removedStates = [];
    for (const [id, value] of stateEntries(target)) {
      if (!value || !DEBUFF_STATES.has(id)) continue;
      applyStateDetach(target, id, value);
      delete target.state[id];
      removedStates.push({ unit: target.uuid, stateId: id });
    }
    return { removedStates };
  },

  // 对技能最多的敌人造成伤害，并给所有「有技能在冷却」的敌人施加技能封印
  sealMagic(unit, skill, targets, helpers, ctx) {
    const enemies = (ctx.enemies || []).filter((item) => item.hp > 0);
    if (!enemies.length) return { skipCast: true };
    const level = Math.max(1, Number(unit.skills?.sealMagic?.level) || 1);
    const intelligence = unitStat(unit, "intelligence");
    const sorted = [...enemies].sort((left, right) => Object.keys(left.skills || {}).length - Object.keys(right.skills || {}).length);
    const main = sorted[sorted.length - 1];
    const skillCount = Object.keys(main.skills || {}).length;
    const raw = Math.floor(12 + intelligence * (1.4 + 0.05 * level) + skillCount * 45);
    const states = [];
    for (const enemy of enemies) {
      if (!enemy.skillColddown || !Object.keys(enemy.skillColddown).length) continue;
      addUnitState(enemy, "skillSeal", 4, { sourceUnitUuid: unit.uuid });
      states.push({ unit: enemy.uuid, stateId: "skillSeal", duration: 4 });
    }
    return { damage: { [main.uuid]: damageEntry(raw, { damageType: "magical" }) }, states };
  },

  // 目标有增益时追加伤害并无视防御
  punish(unit, skill, targets, helpers, ctx) {
    const enemies = (ctx.enemies || []).filter((item) => item.hp > 0);
    const target = pickRandom(visibleTargets(enemies));
    if (!target) return { skipCast: true };
    const intelligence = unitStat(unit, "intelligence");
    const targetIntelligence = unitStat(target, "intelligence");
    const buffed = hasAnyState(target, BUFF_STATES);
    let raw = 14 + 0.7 * intelligence + 1.3 * targetIntelligence;
    if (buffed) raw += 0.5 * intelligence + 0.7 * targetIntelligence;
    return {
      damage: { [target.uuid]: damageEntry(raw, { damageType: "magical", ignoreDefence: buffed }) }
    };
  },

  // 每个敌人驱散 1 个增益，伤害随驱散数量提高，无视 50% 防御
  detectMagic(unit, skill, targets, helpers, ctx) {
    const enemies = (ctx.enemies || []).filter((item) => item.hp > 0);
    if (!enemies.length) return { skipCast: true };
    const intelligence = unitStat(unit, "intelligence");
    const level = Math.max(1, Number(unit.skills?.detectMagic?.level) || 1);
    const removedStates = [];
    let dispelled = 0;
    for (const enemy of enemies) {
      const buff = stateEntries(enemy).find(([id, value]) => value && BUFF_STATES.has(id));
      if (!buff) continue;
      applyStateDetach(enemy, buff[0], buff[1]);
      delete enemy.state[buff[0]];
      removedStates.push({ unit: enemy.uuid, stateId: buff[0] });
      dispelled += 1;
    }
    const raw = Math.floor(8 + 0.6 * intelligence + 10 * dispelled + 5 * level);
    const damage = {};
    for (const enemy of enemies) {
      damage[enemy.uuid] = damageEntry(raw, { damageType: "magical", ignoreDefencePercent: 50 });
    }
    return { damage, removedStates };
  },

  // 攻击力 100%，己方每多一个存活单位提高 50%
  strengthInKittyNumbers(unit, skill, targets, helpers, ctx) {
    const target = pickRandom(visibleTargets((ctx.enemies || []).filter((item) => item.hp > 0)));
    if (!target) return { skipCast: true };
    const alive = (ctx.allies || []).filter((item) => item.hp > 0 && !item.isSummoned).length;
    const raw = unitStat(unit, "attacking") * (1 + 0.5 * alive);
    return { damage: { [target.uuid]: damageEntry(raw, { damageType: "physical" }) } };
  },

  // 每个阵亡友军回 15% 最大生命并永久 +10 攻击（召唤幻影部分没有召唤系统，不含）
  darkRitual(unit, skill, targets, helpers, ctx) {
    const dead = (ctx.allies || []).filter((item) => !(item.hp > 0)).length;
    const heal = Math.floor((Number(unit.maxHp) || 0) * 0.15 * dead);
    if (dead > 0) statBucket(unit, "attacking").level = roundOne(Number(unit.status.attacking.level) + 10 * dead);
    if (heal <= 0 && dead === 0) return { skipCast: true };
    return { heal: heal > 0 ? { [unit.uuid]: heal } : {} };
  },

  // 所有敌人随机一个技能进入 3 回合冷却，自身进入潜行（潜行是给自己的，不能跟着 targets 挂）
  slientSmokeScreen(unit, skill, targets, helpers, ctx) {
    const enemies = (ctx.enemies || []).filter((item) => item.hp > 0);
    const cooldown = [];
    for (const enemy of enemies) {
      const ids = Object.keys(enemy.skills || {}).filter((id) => id !== "baseAttack");
      const chosen = pickRandom(ids);
      if (!chosen) continue;
      enemy.skillColddown = enemy.skillColddown || {};
      enemy.skillColddown[chosen] = (Number(enemy.skillColddown[chosen]) || 0) + 3;
      cooldown.push({ unit: enemy.uuid, skillId: chosen, colddown: enemy.skillColddown[chosen] });
    }
    addUnitState(unit, "sneak", 2, { sourceUnitUuid: unit.uuid });
    return { cooldowns: cooldown, states: [{ unit: unit.uuid, stateId: "sneak", duration: 2 }] };
  },

  // 概率沉默，没被沉默的获得「遗言」
  groupSilence(unit, skill, targets, helpers, ctx) {
    const intelligence = unitStat(unit, "intelligence");
    const level = Math.max(1, Number(unit.skills?.groupSilence?.level) || 1);
    const chance = Math.max(0, Math.min(1, 0.4 + 0.5 * intelligence + 0.01 * level));
    const states = [];
    for (const enemy of (ctx.enemies || []).filter((item) => item.hp > 0)) {
      const stateId = Math.random() < chance ? "silence" : "lastWord";
      const duration = stateId === "silence" ? 2 : 3;
      addUnitState(enemy, stateId, duration, { sourceUnitUuid: unit.uuid });
      states.push({ unit: enemy.uuid, stateId, duration });
    }
    return { states };
  },

  // 恐慌：敌人每点智力降低 2% 几率
  prankSmoke(unit, skill, targets, helpers, ctx) {
    const states = [];
    for (const enemy of (ctx.enemies || []).filter((item) => item.hp > 0)) {
      const chance = Math.max(0, 1 - 0.02 * unitStat(enemy, "intelligence"));
      if (Math.random() >= chance) continue;
      addUnitState(enemy, "fluster", 2, { sourceUnitUuid: unit.uuid });
      states.push({ unit: enemy.uuid, stateId: "fluster", duration: 2 });
    }
    return { states };
  },

  // 只对行动顺序最前的那个敌人生效
  fearInduction(unit, skill, targets, helpers, ctx) {
    const enemies = visibleTargets((ctx.enemies || []).filter((item) => item.hp > 0));
    const target = enemies.sort((left, right) => unitStat(right, "dexterity") - unitStat(left, "dexterity"))[0];
    if (!target) return { skipCast: true };
    addUnitState(target, "fluster", 3, { sourceUnitUuid: unit.uuid });
    return { states: [{ unit: target.uuid, stateId: "fluster", duration: 3 }] };
  }
};

// 技能自己声明的状态（stateValues）挂上去，供 handler 里复用
function applyStates(unit, skill, targets, result = { states: [] }) {
  if (!Array.isArray(skill.stateValues)) return result.states;
  const targetCount = Math.max(1, targets.length);
  for (const target of targets) {
    for (const entry of skill.stateValues) {
      if (entry.stateId === "shield") continue;
      const value = entry.value ? evalSkillExpr(unit, entry.value, target, targetCount, skill.id) : null;
      addUnitState(target, entry.stateId, entry.duration, { sourceUnitUuid: unit.uuid, actualValue: value });
      result.states.push({ unit: target.uuid, stateId: entry.stateId, duration: entry.duration, actualValue: value });
    }
  }
  return result.states;
}

/**
 * 结算一次施放。调用方负责扣 MP / 设冷却 / 推送事件。
 * @param {object} unit 施放者
 * @param {{skill: object, targets: object[]}} action
 * @param {{defenceOf: (unit) => number, finalDamage: (attack, defence) => number}} helpers
 * @param {{allies: object[], enemies: object[]}} aiCtx 手写技能要用到的场面信息
 */
export function resolveSkillEffects(unit, action, helpers, aiCtx = {}) {
  const { skill } = action;
  const { targets } = action;
  const result = {
    skillId: skill.id,
    mpCost: skill.mpCost,
    damage: {},
    heal: {},
    shield: {},
    states: [],
    removedStates: [],
    cooldowns: [],
    skipCast: false
  };
  const isDamage = skill.types.includes("Damage") && skill.damageType && skill.damageType !== "NoDamage";
  const isHeal = skill.types.includes("Heal") && !isDamage;
  const isShield = skill.types.includes("Shield") && !isDamage && !isHeal;
  const targetCount = Math.max(1, targets.length);
  const ctx = {
    allies: aiCtx.allies || [],
    enemies: aiCtx.enemies || [],
    passedTurn: aiCtx.passedTurn || 0
  };

  const handler = SKILL_HANDLERS[skill.id];
  const patch = handler ? handler(unit, skill, targets, helpers, ctx) || {} : null;
  if (patch?.skipCast) {
    result.skipCast = true;
    return result;
  }

  // 数值（伤害/治疗/护盾）：handler 自己算过伤害就不再走通用算式，避免同一份伤害算两遍
  const skipAutoAmount = Boolean(patch?.damage);
  if (skill.value && !skipAutoAmount) {
    for (const target of targets) {
      const raw = skillRawValue(unit, skill, target, targetCount);
      if (isDamage && raw > 0) addDamage(result, target, raw, skill, helpers);
      if (isHeal && raw > 0) addHeal(result, target, raw);
      if (!isDamage && !isHeal && isShield && raw > 0) addShield(result, target, raw);
    }
  }

  // 状态：handler 已经自己挂过状态的技能不再重复挂
  if (!patch?.states) applyStates(unit, skill, targets, result);

  if (patch) {
    for (const [unitId, entry] of Object.entries(patch.damage || {})) {
      const target = targets.find((item) => item.uuid === unitId)
        || ctx.enemies.find((item) => item.uuid === unitId)
        || ctx.allies.find((item) => item.uuid === unitId);
      if (!target) continue;
      addDamage(result, target, entry.raw, { ...skill, damageType: entry.damageType || skill.damageType }, helpers, entry);
    }
    for (const [unitId, value] of Object.entries(patch.heal || {})) {
      const target = ctx.allies.find((item) => item.uuid === unitId) || unit;
      addHeal(result, target, value);
    }
    for (const [unitId, value] of Object.entries(patch.shield || {})) {
      const target = ctx.allies.find((item) => item.uuid === unitId) || unit;
      addShield(result, target, value);
    }
    for (const item of patch.states || []) result.states.push(item);
    for (const item of patch.removedStates || []) result.removedStates.push(item);
    for (const item of patch.cooldowns || []) result.cooldowns.push(item);
  }
  return result;
}

function addDamage(result, target, raw, skill, helpers, options = {}) {
  const defence = helpers?.defenceOf ? helpers.defenceOf(target) : 0;
  let effectiveDefence = defence;
  if (options.ignoreDefence) effectiveDefence = 0;
  else if (options.ignoreDefencePercent) {
    effectiveDefence = defence * (1 - Math.min(100, Number(options.ignoreDefencePercent) || 0) / 100);
  }
  const final = options.ignoreDefence || skill.damageType === "True"
    ? Math.max(1, raw)
    : (helpers?.finalDamage ? helpers.finalDamage(raw, effectiveDefence) : Math.max(1, raw - effectiveDefence));
  const applied = applyIncomingDamage(target, final);
  const damageType = options.damageType || skill.damageType;
  const bucket = result.damage[target.uuid] || { value: 0, fDamage: 0, damageType: damageType === "True" ? "true" : (damageType === "Magical" ? "magical" : "physical"), shieldDamage: 0 };
  bucket.value += final;
  bucket.fDamage += applied.absorbedByShield ? 0 : applied.damage;
  bucket.shieldDamage += applied.absorbedByShield;
  bucket.remainingHp = target.hp;
  result.damage[target.uuid] = bucket;
  return bucket;
}

function addHeal(result, target, raw) {
  const before = Number(target.hp) || 0;
  target.hp = Math.min(Number(target.maxHp) || 0, before + Math.max(0, Math.floor(Number(raw) || 0)));
  const healed = Math.max(0, target.hp - before);
  if (healed > 0) result.heal[target.uuid] = (result.heal[target.uuid] || 0) + healed;
}

function addShield(result, target, raw) {
  const value = Math.max(0, Math.floor(Number(raw) || 0));
  if (!value) return;
  target.tmpShield = Math.max(0, Number(target.tmpShield) || 0) + value;
  result.shield[target.uuid] = (result.shield[target.uuid] || 0) + value;
}

// ---- 经验 ----

/**
 * 给技能加经验，越过门槛就升级。返回升级次数。
 * SKILL_EXP_TABLE[level] 是「从 level 升到 level+1」需要的经验（与前端技能卡一致）。
 */
export function grantSkillExp(unit, skillId, amount) {
  const state = unit.skills?.[skillId];
  if (!state) return 0;
  const gained = Math.max(0, Math.floor(Number(amount) || 0));
  if (!gained) return 0;
  state.exp = Math.max(0, Number(state.exp) || 0) + gained;
  let levelUps = 0;
  while (state.level < SKILL_EXP_TABLE.length - 1 && state.exp >= SKILL_EXP_TABLE[state.level]) {
    state.exp -= SKILL_EXP_TABLE[state.level];
    state.level += 1;
    levelUps += 1;
  }
  return levelUps;
}

export function skillExpToNext(level) {
  return SKILL_EXP_TABLE[Math.max(0, Math.min(SKILL_EXP_TABLE.length - 1, Math.floor(Number(level) || 1)))] || 0;
}
