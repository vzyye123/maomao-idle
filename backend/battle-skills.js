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
// 生活等级（采集/缝纫/锻造/畜牧…）：生活技能书里的算式直接把它当数值用
// （参考站写在 unit.status.otherStatus.<key>.level，本地的 status 是平的，两种形态都兼容）
const LIFE_STATS = [
  "collecting", "cooking", "enhance", "exploring", "farmingAnimal", "farmingPlant", "fishing",
  "forging", "knowledge", "manufacturing", "mining", "mysterious", "sewing", "trading"
];
const SCOPE_KEYS = [
  ...SELF_STATS, ...TARGET_STATS, ...LIFE_STATS,
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
  "lastWord", "dragonRoarDebuff", "fishmanSkillSource", "bleeding", "irrevocable"
]);
const BUFF_STATES = new Set([
  "atkUp", "defUp", "shield", "ironWall", "astralBarrier", "sneak", "regen", "bless", "selfHeal",
  "boneShield", "demonicRage", "lastStand", "natureGift", "enhanceEmpowerState",
  "sowMelonsReapMelonsRegen", "sowMelonsReapMelonsColddown", "sowMelonsReapMelonsLuck",
  "knowledgeInspirationState"
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
  taunt: "嘲讽",
  bleeding: "流血",
  irrevocable: "不可复活",
  natureGift: "自然时运",
  enhanceEmpowerState: "强化赋能",
  knowledgeInspirationState: "知识启迪",
  sowMelonsReapMelonsRegen: "种瓜得瓜(状态恢复)",
  sowMelonsReapMelonsColddown: "种瓜得瓜(重置冷却)",
  sowMelonsReapMelonsLuck: "得瓜"
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
  shield: {},
  // 流血：每层每回合掉「当前生命 5%」，上限是施加者力量*300%，无视防御
  bleeding: { turnStartPercentCurrentHp: 0.05, damageCapFromCasterStrength: 3 },
  // 被「吞噬天地」打死的单位不能再被复活
  irrevocable: { forbidRevive: true },
  // 纯标记：自然时运只影响掉落率，知识启迪只是「4 回合内不再吃冷却缩减」的免疫标记
  natureGift: {},
  knowledgeInspirationState: {},
  // 强化赋能：把 actualValue 加到「当前最高属性」上（参考站按 extra.mainStatus 走）
  enhanceEmpowerState: { statKeyFromRecord: true },
  // 种瓜得瓜的三个状态都在「到期」时结算：恢复一半已损失生命/魔法、清空技能冷却、加 4 幸运
  sowMelonsReapMelonsRegen: { detachHealMissingRatio: 0.5 },
  sowMelonsReapMelonsColddown: { detachClearCooldown: true },
  sowMelonsReapMelonsLuck: { stat: { luck: 1 }, defaultValue: 4 }
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
  // 加在「动态属性」上的状态（强化赋能：施放时已经算好是力量还是敏捷/智力）
  if (def.statKeyFromRecord) {
    const key = record.mainStatus || "strength";
    const strength = Number(record.actualValue ?? def.defaultValue ?? 0) || 0;
    if (strength) {
      const bucket = statBucket(unit, key);
      bucket.level = roundOne(Number(bucket.level) + strength);
      record.appliedStats[key] = strength;
    }
  }
  if (def.damageCapTimes) record.remainingTimes = def.damageCapTimes;
}

function applyStateDetach(unit, stateId, record, out = null) {
  const def = STATE_DEFS[stateId];
  if (!def) return;
  for (const [key, delta] of Object.entries(record.appliedStats || {})) {
    const bucket = statBucket(unit, key);
    bucket.level = roundOne(Number(bucket.level) - Number(delta));
  }
  record.appliedStats = {};
  // 到期才结算的效果（参考站写在 onDetach 里）：
  // 种瓜得瓜·恢复 → 补一半已损失的生命与魔法；种瓜得瓜·重置冷却 → 清空技能冷却
  if (def.detachHealMissingRatio && out) {
    const ratio = Number(def.detachHealMissingRatio) || 0;
    const missingHp = Math.max(0, (Number(unit.maxHp) || 0) - (Number(unit.hp) || 0));
    const missingMp = Math.max(0, (Number(unit.maxMp) || 0) - (Number(unit.mp) || 0));
    const healHp = Math.min(missingHp, Math.floor(missingHp * ratio));
    const healMp = Math.min(missingMp, Math.floor(missingMp * ratio));
    if (healHp > 0) {
      unit.hp = (Number(unit.hp) || 0) + healHp;
      out.heal.push({ unit: unit.uuid, value: healHp, stateId });
    }
    if (healMp > 0) {
      unit.mp = (Number(unit.mp) || 0) + healMp;
      out.mpRestore.push({ unit: unit.uuid, value: healMp, stateId });
    }
  }
  if (def.detachClearCooldown && out) {
    if (unit.skillColddown && Object.keys(unit.skillColddown).length) {
      unit.skillColddown = {};
      out.cooldowns.push({ unit: unit.uuid, stateId });
    }
  }
}

/**
 * 回合开始给单位结算状态：剩余回合 -1，到 0 就摘掉（摘掉时把属性还原）。
 * 返回被摘掉的状态 id，供调用方决定是否推送事件。
 * out（可选）会被填入「到期才结算」的效果：{ heal: [], mpRestore: [], cooldowns: [] }
 */
export function tickStates(unit, out = null) {
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
      applyStateDetach(unit, id, value, out);
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
    // 流血：每层按「当前生命」比例掉血，上限是施加者力量*300%（参考站 bleeding）
    if (def.turnStartPercentCurrentHp) {
      const ratio = Number(def.turnStartPercentCurrentHp) || 0;
      const stacks = Math.max(1, Number(record.stack) || 1);
      let value = Math.floor((Number(unit.hp) || 0) * ratio * stacks);
      if (def.damageCapFromCasterStrength) {
        const caster = members.find((item) => item.uuid === record.sourceUnitUuid);
        const cap = Math.floor(unitStat(caster || unit, "strength") * def.damageCapFromCasterStrength);
        value = Math.min(value, cap);
      }
      if (value <= 0) continue;
      unit.hp = Math.max(0, unit.hp - value);
      out.damage.push({ unit: unit.uuid, value, stateId: id, damageType: "physical", sourceUnitUuid: record.sourceUnitUuid });
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
      // 复活要选「已经倒下」的友军；没人倒下就别放（否则只是白占一回合）
      // 「不可复活」（吞噬天地打死的）也要跳过
      if ((def.types || []).includes("Revive")) {
        const dead = (ctx.members || ctx.allies || [])
          .filter((item) => !(item.hp > 0) && !item.state?.irrevocable
            && Boolean(item.isPlayerUnit) === Boolean(unit.isPlayerUnit));
        return dead.length ? [pickRandom(dead)] : [];
      }
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

// 召唤系统没做（战斗成员在开局就固定了），这些技能放了也没有实体可加，
// 与其空放浪费一回合，不如退回普攻。summonBerryBird 的类型只有 Summon，
// 抽出来的算式其实是召唤物的数值，若照伤害/治疗结算会是错的。
const SKIP_CAST = new Set(["clownSummon", "mirrorImage", "summonBerryBird"]);

function isCastable(def) {
  if (def.neverCast || SKIP_CAST.has(def.id)) return false;
  if (def.value) return Boolean(compileValue(def.value));
  if (Array.isArray(def.stateValues) && def.stateValues.length) return true;
  return Boolean(SKILL_HANDLERS[def.id]);
}

/**
 * 参考站里怪物没配技能逻辑，玩家也可能不配；给纯治疗技能一条通用常识：
 * 全员满血时放治疗只是白占一回合。带状态/手写实现的技能不拦（可能还有别的效果）。
 */
function healWouldMatter(def, ctx) {
  const types = def.types || [];
  if (!types.includes("Heal") || types.includes("Damage")) return true;
  if ((def.states || []).length) return true;
  if (SKILL_HANDLERS[def.id]) return true;
  const allies = (ctx.allies || []).filter((item) => item.hp > 0);
  if (!allies.length) return true;
  return allies.some((item) => (Number(item.hp) || 0) < (Number(item.maxHp) || 0));
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
    if (!healWouldMatter(def, ctx)) continue;
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

// 生活等级：缺省 1（参考站写的是 `??1`）。没练过的号也有一条基准线，算式不会除零
function lifeLevel(unit, key) {
  const status = unit?.status || {};
  const flat = Number(status[key]?.level);
  if (Number.isFinite(flat) && flat > 0) return flat;
  const nested = Number(status.otherStatus?.[key]?.level ?? unit?.otherStatus?.[key]?.level);
  return Number.isFinite(nested) && nested > 0 ? nested : 1;
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
  for (const key of LIFE_STATS) scope[key] = lifeLevel(unit, key);
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
    if (!Number.isFinite(value)) return 0;
    // 状态强度可能是百分比小数（自然时运 0.024、爆炒-酸 0.01…），不能一律取整，
    // 否则这些状态会变成 0。伤害/治疗都远大于 1，取整行为不受影响。
    const clamped = Math.max(0, value);
    return clamped >= 1 ? Math.floor(clamped) : Math.round(clamped * 10000) / 10000;
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

// 迷雾幽灵攻击：所有单位（含友军）按比例流失生命，最低留 1 点。
// 参考站直接改 hp，不走伤害结算；这里走 damage 通道，实际扣血被限制在「当前生命 -1」。
function ghostDrain(ctx, ratio, basis) {
  const members = [...(ctx.allies || []), ...(ctx.enemies || [])].filter((item) => item.hp > 0);
  const damage = {};
  for (const member of members) {
    const base = basis === "max" ? Number(member.maxHp) || 0 : Number(member.hp) || 0;
    const raw = Math.max(1, Math.floor(base * ratio));
    if (raw <= 0) continue;
    damage[member.uuid] = damageEntry(Math.min(raw, Math.max(0, (Number(member.hp) || 0) - 1)));
  }
  return { damage };
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
  },

  // 穿针引线：按行动顺序依次打所有敌人，每命中一个后续伤害 -5%，无视防御
  threadingNeedle(unit, skill, targets, helpers, ctx) {
    const enemies = (ctx.enemies || []).filter((item) => item.hp > 0);
    if (!enemies.length) return { skipCast: true };
    const level = Math.max(1, Number(unit.skills?.threadingNeedle?.level) || 1);
    let raw = Math.floor(10 + unitStat(unit, "attacking") * (0.6 + 0.02 * level)
      + lifeLevel(unit, "sewing") * (3.5 + 0.02 * level));
    const step = Math.floor(raw * 0.05);
    // ctx 里没有 turnOrder，用敏捷降序近似「行动顺序」
    const ordered = [...enemies].sort((left, right) => unitStat(right, "dexterity") - unitStat(left, "dexterity"));
    const damage = {};
    for (const enemy of ordered) {
      damage[enemy.uuid] = damageEntry(raw, { damageType: "physical", ignoreDefence: true });
      raw = Math.max(1, raw - step);
    }
    return { damage };
  },

  // 知识启迪：全体回蓝 + 减技能冷却；同一单位 4 回合内只吃一次（用状态当免疫标记）
  knowledgeInspiration(unit, skill, targets, helpers, ctx) {
    const allies = (ctx.allies || []).filter((item) => item.hp > 0);
    if (!allies.length) return { skipCast: true };
    const level = Math.max(1, Number(unit.skills?.knowledgeInspiration?.level) || 1);
    const knowledge = lifeLevel(unit, "knowledge");
    const amount = Math.floor(10 + knowledge * (0.4 + 0.01 * level));
    const reduce = 1 + Math.floor(0.034 * knowledge);
    const mp = {};
    const states = [];
    for (const ally of allies) {
      const max = Number(ally.maxMp) || 0;
      const gained = Math.max(0, Math.min(max - (Number(ally.mp) || 0), amount));
      if (gained > 0) {
        ally.mp = (Number(ally.mp) || 0) + gained;
        mp[ally.uuid] = gained;
      }
      if (reduce <= 0 || ally.state?.knowledgeInspirationState) continue;
      // 「知识启迪」自己不吃冷却缩减（参考站显式排除）
      for (const id of Object.keys(ally.skillColddown || {})) {
        if (id === "knowledgeInspiration") continue;
        const left = Number(ally.skillColddown[id]) || 0;
        if (left <= 0) continue;
        ally.skillColddown[id] = Math.max(0, left - reduce);
      }
      addUnitState(ally, "knowledgeInspirationState", 4, { sourceUnitUuid: unit.uuid, actualValue: reduce });
      states.push({ unit: ally.uuid, stateId: "knowledgeInspirationState", duration: 4, actualValue: reduce });
    }
    return { mp, states };
  },

  // 种瓜得瓜：随机给 N 个「身上没有那三个状态」的友军挂上其中一个（恢复 / 重置冷却 / 得瓜）
  sowMelonsReapMelons(unit, skill, targets, helpers, ctx) {
    const marks = ["sowMelonsReapMelonsRegen", "sowMelonsReapMelonsColddown", "sowMelonsReapMelonsLuck"];
    const pool = (ctx.allies || []).filter((item) => item.hp > 0 && marks.every((id) => !item.state?.[id]));
    if (!pool.length) return { skipCast: true };
    const count = Math.min(pool.length, Math.max(1, Math.floor(1 + 0.1 * lifeLevel(unit, "farmingPlant"))));
    const picked = [];
    const candidates = [...pool];
    for (let index = 0; index < count; index += 1) {
      const [chosen] = candidates.splice(Math.floor(Math.random() * candidates.length), 1);
      if (!chosen) break;
      picked.push(chosen);
    }
    const level = Math.max(1, Number(unit.skills?.sowMelonsReapMelons?.level) || 1);
    const states = [];
    for (const ally of picked) {
      const stateId = pickRandom(marks);
      addUnitState(ally, stateId, 4, { sourceUnitUuid: unit.uuid });
      states.push({ unit: ally.uuid, stateId, duration: 4 });
    }
    // 每成功施加一个就给自己一份随机生活经验（参考站：1 + 技能等级*5%，每多一个 +1）
    const lifeExp = picked.length
      ? { status: pickRandom(["collecting", "mining", "fishing", "farmingAnimal", "farmingPlant"]), amount: (1 + 0.05 * level) + (picked.length - 1) }
      : null;
    return { states, lifeExp };
  },

  // 强化赋能：给「没有强化赋能、也不是召唤物」的友军加主属性。
  // 参考站挑的是「装备强化总等级最高」的友军，本地没有装备强化系统，按阵容顺序取第一个。
  enhanceEmpower(unit, skill, targets, helpers, ctx) {
    const candidates = (ctx.allies || []).filter((item) => item.hp > 0 && !item.isSummoned && !item.state?.enhanceEmpowerState);
    if (!candidates.length) return { skipCast: true };
    const target = candidates[0];
    const level = Math.max(1, Number(unit.skills?.enhanceEmpower?.level) || 1);
    const value = Math.floor(0.2 * lifeLevel(unit, "enhance") + 0.3 * level);
    if (value <= 0) return { skipCast: true };
    const main = ["strength", "dexterity", "intelligence"]
      .reduce((best, key) => (unitStat(target, key) > unitStat(target, best) ? key : best), "strength");
    addUnitState(target, "enhanceEmpowerState", 5, { sourceUnitUuid: unit.uuid, actualValue: value, mainStatus: main });
    return { states: [{ unit: target.uuid, stateId: "enhanceEmpowerState", duration: 5, actualValue: value }] };
  },

  // 强化冲击：智力不低于力量/敏捷时打魔法，否则物理；
  // 伤害 = 0.6*对应属性 + 强化等级*(2 + 0.02*技能等级)，装备强化加成在本地恒为 0
  enhanceStrike(unit, skill, targets, helpers, ctx) {
    const enemies = (ctx.enemies || []).filter((item) => item.hp > 0);
    if (!enemies.length) return { skipCast: true };
    const level = Math.max(1, Number(unit.skills?.enhanceStrike?.level) || 1);
    const intelligence = unitStat(unit, "intelligence");
    const magical = intelligence >= unitStat(unit, "strength") && intelligence >= unitStat(unit, "dexterity");
    const base = magical ? intelligence : unitStat(unit, "attacking");
    const raw = Math.floor(0.6 * base + lifeLevel(unit, "enhance") * (2 + 0.02 * level));
    const damage = {};
    for (const enemy of enemies) {
      damage[enemy.uuid] = damageEntry(raw, { damageType: magical ? "magical" : "physical" });
    }
    return { damage };
  },

  // 迷雾幽灵攻击：所有单位流失当前生命 5%（Boss 版是最大生命 25%）
  denseFogSpriteAttack(unit, skill, targets, helpers, ctx) {
    return ghostDrain(ctx, 0.05, "current");
  },
  denseFogSpriteAttackBoss(unit, skill, targets, helpers, ctx) {
    return ghostDrain(ctx, 0.25, "max");
  },

  // 吞噬天地：打「当前生命比例最低」的敌人，400 + 已损失生命 95%，无视防御；
  // 打死的单位挂「不可复活」（参考站在伤害结算之后判断，这里按扣血前的数值预估）
  nianWorldSwallower(unit, skill, targets, helpers, ctx) {
    const enemies = (ctx.enemies || []).filter((item) => item.hp > 0);
    if (!enemies.length) return { skipCast: true };
    const ratioOf = (item) => (Number(item.hp) || 0) / Math.max(1, Number(item.maxHp) || 1);
    const target = enemies.reduce((best, item) => (ratioOf(item) < ratioOf(best) ? item : best), enemies[0]);
    const lost = Math.max(0, (Number(target.maxHp) || 0) - (Number(target.hp) || 0));
    const raw = Math.floor(400 + 0.95 * lost);
    const states = [];
    const afterShield = Math.max(0, raw - (Number(target.tmpShield) || 0));
    if ((Number(target.hp) || 0) - afterShield <= 0 && !target.state?.irrevocable) {
      addUnitState(target, "irrevocable", 99, { sourceUnitUuid: unit.uuid });
      states.push({ unit: target.uuid, stateId: "irrevocable", duration: 99 });
    }
    return { damage: { [target.uuid]: damageEntry(raw, { damageType: "physical", ignoreDefence: true }) }, states };
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
    // 回蓝 / 生活经验这类没有独立事件通道的效果，由手写 handler 填
    mp: {},
    lifeExp: null,
    states: [],
    removedStates: [],
    cooldowns: [],
    skipCast: false
  };
  const isDamage = skill.types.includes("Damage") && skill.damageType && skill.damageType !== "NoDamage";
  // 复活按治疗结算：目标是 0 血单位时 addHeal 直接把它拉回 min(maxHp, 数值)
  const isHeal = (skill.types.includes("Heal") || skill.types.includes("Revive")) && !isDamage;
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
    for (const [unitId, value] of Object.entries(patch.mp || {})) {
      if (!(value > 0)) continue;
      result.mp[unitId] = (result.mp[unitId] || 0) + Math.floor(value);
    }
    if (patch.lifeExp?.status && patch.lifeExp?.amount > 0) {
      result.lifeExp = { status: patch.lifeExp.status, amount: patch.lifeExp.amount };
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
  // 手写 handler 里写的是小写（magical/physical），catalog 里是大写（Magical/True），统一按小写比
  const normalizedType = String(damageType || "").toLowerCase();
  const bucket = result.damage[target.uuid] || { value: 0, fDamage: 0, damageType: normalizedType === "true" ? "true" : (normalizedType === "magical" ? "magical" : "physical"), shieldDamage: 0 };
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
