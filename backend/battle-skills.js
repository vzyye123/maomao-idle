// 战斗技能引擎：把「技能页」里启用的技能真正接进回合结算。
//
// 数据来源是 ./skill-catalog.js（由 .tmp/gen-skill-catalog.py 从参考站前端 bundle
// game-battle-skill-I4Ckwbp2.js 里提取）：每个技能带静态字段 + 一条从 effect 源码里
// 抠出来的数值算式（变量已换成属性名）。算式用 new Function 编译后求值，所以伤害/治疗/
// 护盾的数值与参考站同源；但 effect 里的条件分支（血量阈值追加伤害、连击判定、召唤、
// 复活、被动触发）没有移植 —— 这类技能 value 为 null，selectSkill 会跳过它（退回普攻）。
//
// 状态：只对「控制类」做真实影响（不能行动 / 不能放技能），其余状态挂在单位上随
// battle:update 下发供前端显示，不做数值结算。
import skillCatalog from "./skill-catalog.js";

export const SKILL_EXP_TABLE = skillCatalog.expTable;
const SKILLS = skillCatalog.skills;

const SCOPE_KEYS = [
  "attacking", "defencing", "strength", "stamina", "intelligence", "dexterity", "battle", "luck",
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

// ---- 状态 ----

// 这些状态让单位本回合无法行动（参考站里是 consumeTurn 那一类）
const INCAPACITATING_STATES = new Set(["stun", "frozen", "sleep", "paralysis", "petrify", "banished"]);
// 这些状态禁止施放技能（普攻仍可）
const SILENCING_STATES = new Set(["silence", "skillSeal"]);

const STATE_LABELS = {
  stun: "眩晕",
  frozen: "冻结",
  silence: "沉默",
  skillSeal: "禁魔",
  banished: "放逐",
  sneak: "潜行",
  shield: "护盾",
  burn: "灼烧",
  venom: "中毒",
  regen: "再生",
  bless: "祝福",
  ironWall: "铁壁",
  astralBarrier: "星辉结界",
  armorBreak: "破甲",
  fluster: "慌乱",
  dragonRoarDebuff: "龙威"
};

export function stateLabel(stateId) {
  return STATE_LABELS[stateId] || stateId;
}

function stateEntries(unit) {
  return unit && unit.state && typeof unit.state === "object" ? Object.entries(unit.state) : [];
}

export function isIncapacitated(unit) {
  return stateEntries(unit).some(([id, value]) => value && INCAPACITATING_STATES.has(id));
}

export function isSilenced(unit) {
  return stateEntries(unit).some(([id, value]) => value && SILENCING_STATES.has(id));
}

/**
 * 回合开始给单位结算状态：剩余回合 -1，到 0 就摘掉。
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
      delete unit.state[id];
      expired.push(id);
    } else {
      value.remainingDuration = next;
    }
  }
  return expired;
}

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
  unit.state[stateId] = record;
  return true;
}

// ---- 目标选择 ----

function pickRandom(list) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function pickTargets(def, unit, ctx) {
  const enemies = (ctx.enemies || []).filter((item) => item.hp > 0);
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
      return enemies;
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
    if (!def || !def.value) continue;
    const state = unit.skills?.[skillId];
    if (!state || state.enabled === false) continue;
    if ((Number(unit.skillColddown?.[skillId]) || 0) > 0) continue;
    if ((Number(unit.mp) || 0) < def.mpCost) continue;
    const targets = pickTargets(def, unit, ctx);
    if (!targets.length) continue;
    if (!evalSkillLogic(unit.skillLogic?.[skillId], unit, ctx)) continue;
    return { skill: def, targets };
  }
  return null;
}

// ---- 结算 ----

function unitStat(unit, key) {
  const value = unit?.status?.[key];
  return Number(value?.level) || 1;
}

function valueScope(unit, target, level, targetCount) {
  return {
    attacking: unitStat(unit, "attacking"),
    defencing: unitStat(unit, "defencing"),
    strength: unitStat(unit, "strength"),
    stamina: unitStat(unit, "stamina"),
    intelligence: unitStat(unit, "intelligence"),
    dexterity: unitStat(unit, "dexterity"),
    battle: unitStat(unit, "battle"),
    luck: unitStat(unit, "luck"),
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
}

export function skillRawValue(unit, skill, target, targetCount = 1) {
  const fn = compileValue(skill.value);
  if (!fn) return 0;
  const level = Math.max(1, Math.floor(Number(unit.skills?.[skill.id]?.level) || 1));
  const scope = valueScope(unit, target, level, targetCount);
  try {
    const raw = fn(...SCOPE_KEYS.map((key) => scope[key]));
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  } catch {
    return 0;
  }
}

const SHIELD_SKILLS = new Set(["groupShield", "ironWall", "astralBarrier", "boneShield"]);

/**
 * 结算一次施放。调用方负责扣 MP / 设冷却 / 推送事件。
 * @param {object} unit 施放者
 * @param {{skill: object, targets: object[]}} action
 * @param {{defenceOf: (unit) => number, finalDamage: (attack, defence) => number}} helpers
 */
export function resolveSkillEffects(unit, action, helpers) {
  const { skill } = action;
  const { targets } = action;
  const result = {
    skillId: skill.id,
    mpCost: skill.mpCost,
    damage: {},
    heal: {},
    shield: {},
    states: []
  };
  const isDamage = skill.types.includes("Damage") && skill.damageType && skill.damageType !== "NoDamage";
  const isHeal = skill.types.includes("Heal") && !isDamage;
  const isShield = !isDamage && !isHeal && SHIELD_SKILLS.has(skill.id);
  const targetCount = Math.max(1, targets.length);

  for (const target of targets) {
    const raw = skillRawValue(unit, skill, target, targetCount);
    if (isDamage && raw > 0) {
      const defence = helpers?.defenceOf ? helpers.defenceOf(target) : 0;
      const final = skill.damageType === "True"
        ? Math.max(1, raw)
        : (helpers?.finalDamage ? helpers.finalDamage(raw, defence) : raw);
      const applied = applyDamageToTarget(target, final);
      result.damage[target.uuid] = {
        value: final,
        fDamage: applied.absorbedByShield ? 0 : applied.damage,
        damageType: skill.damageType === "True" ? "true" : (skill.damageType === "Magical" ? "magical" : "physical"),
        remainingHp: target.hp,
        shieldDamage: applied.absorbedByShield
      };
    }
    if (isHeal && raw > 0) {
      const before = Number(target.hp) || 0;
      target.hp = Math.min(Number(target.maxHp) || 0, before + raw);
      const healed = Math.max(0, target.hp - before);
      if (healed > 0) result.heal[target.uuid] = healed;
    }
    if (!isDamage && !isHeal && isShield && raw > 0) {
      target.tmpShield = Math.max(0, Number(target.tmpShield) || 0) + raw;
      result.shield[target.uuid] = raw;
    }
    for (const stateId of skill.states || []) {
      const duration = 2;
      addUnitState(target, stateId, duration, { sourceUnitUuid: unit.uuid });
      result.states.push({ unit: target.uuid, stateId, duration });
    }
  }
  return result;
}

function applyDamageToTarget(target, damage) {
  const shield = Math.max(0, Number(target.tmpShield) || 0);
  if (shield > 0) {
    const absorbed = Math.min(shield, damage);
    target.tmpShield = shield - absorbed;
    const rest = damage - absorbed;
    target.hp = Math.max(0, (Number(target.hp) || 0) - rest);
    return { damage: rest, absorbedByShield: absorbed };
  }
  target.hp = Math.max(0, (Number(target.hp) || 0) - damage);
  return { damage, absorbedByShield: 0 };
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
