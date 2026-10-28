// 自动生成，勿手改：python .tmp/gen-skill-catalog.py
// 数据来源：pulled-frontend/_nuxt/game-battle-skill-I4Ckwbp2.js 的技能表 yl
// value 是从 effect 源码里提取的数值算式（变量已换成属性名），执行用 new Function。
// value 为 null 表示该技能的有效果依赖控制流/上下文，后端不自动施放。
export default {
 "expTable": [
  0,
  20,
  45,
  80,
  125,
  180,
  245,
  320,
  405,
  500,
  605,
  720,
  845,
  980,
  1125,
  1280,
  1445,
  1620,
  1805,
  2000,
  2205,
  2420,
  2645,
  2880,
  3125,
  3380,
  3645,
  3920,
  4205,
  4500,
  4805,
  5760,
  6825,
  8000,
  9285,
  10680,
  12185,
  13800,
  15525,
  17360,
  19305,
  21360,
  23525,
  25800,
  28185,
  30680,
  33285,
  36000,
  38825,
  41760,
  44805,
  52869,
  62386,
  73616,
  86866,
  102502,
  120953,
  142725,
  168415,
  198730,
  234502,
  276712,
  326520,
  385294,
  454647,
  536483,
  633050,
  747000,
  881460,
  1040122,
  1227344,
  1448267,
  1708955,
  2016566,
  2379549,
  2807867,
  3313284,
  3909675,
  4613416,
  5443831,
  6423721,
  7579991,
  8944389,
  10554379,
  12454168,
  14695918,
  17341183,
  20462597,
  24145864,
  28492120,
  33620701,
  39672428,
  46813465,
  55239888,
  65183068,
  76916021,
  90760905,
  107097867,
  126375484,
  149123071,
  175965224,
  202360007,
  232714008,
  267621110,
  307764276,
  353928918,
  407018256,
  468070994,
  538281643,
  619023890,
  711877473,
  818659094,
  941457958,
  1082676652,
  1245078150,
  1431839873,
  1646615854,
  1893608232,
  2177649467,
  2504296887,
  2879941420,
  3311932633,
  3808722528,
  4380030907,
  5037035543,
  5792590875,
  6661479506,
  7660701432,
  8809806647,
  10131277644,
  11650969291,
  13049085606,
  14614975878,
  16368772984,
  18333025742,
  20532988831,
  22996947491,
  25756581190,
  28847370932,
  32309055444,
  36186142098,
  40528479150,
  45391896648,
  50838924245,
  56939595155,
  63772346574,
  71425028162,
  79996031542,
  89595555327,
  100347021966,
  112388664602
 ],
 "skills": {
  "baseAttack": {
   "id": "baseAttack",
   "name": "普通攻击",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 0,
   "mpCost": 0,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": null
  },
  "boneShield": {
   "id": "boneShield",
   "name": "骨盾",
   "tire": 1,
   "target": "self",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 5,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [
    "boneShield"
   ],
   "value": null
  },
  "corrosiveBreath": {
   "id": "corrosiveBreath",
   "name": "腐蚀吐息",
   "tire": 2,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [
    "corrosiveBreath"
   ],
   "value": "5*attacking"
  },
  "summonBerryBird": {
   "id": "summonBerryBird",
   "name": "召唤浆果鸟",
   "tire": 2,
   "target": "self",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 15,
   "damageType": "NoDamage",
   "types": [
    "Summon"
   ],
   "states": [],
   "value": "5+.1*attacking+.2*level"
  },
  "baseHeal": {
   "id": "baseHeal",
   "name": "基础治疗",
   "tire": 1,
   "target": "single_random_ally",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 15,
   "damageType": "NoDamage",
   "types": [
    "Heal"
   ],
   "states": [],
   "value": null
  },
  "poison": {
   "id": "poison",
   "name": "中毒",
   "tire": 1,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 5,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "poison"
   ],
   "value": null
  },
  "selfHeal": {
   "id": "selfHeal",
   "name": "自我疗愈",
   "tire": 2,
   "target": "single_random_ally",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 18,
   "damageType": "NoDamage",
   "types": [
    "Heal"
   ],
   "states": [
    "selfHeal"
   ],
   "value": null
  },
  "sweep": {
   "id": "sweep",
   "name": "横扫",
   "tire": 2,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 4,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "10+Math.floor(attacking*(.8+.01*level)+strength*(.5+.01*level))"
  },
  "baseGroupHeal": {
   "id": "baseGroupHeal",
   "name": "基础群体治疗",
   "tire": 2,
   "target": "all_ally",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 25,
   "damageType": "NoDamage",
   "types": [
    "Heal"
   ],
   "states": [],
   "value": null
  },
  "powerStrike": {
   "id": "powerStrike",
   "name": "重击",
   "tire": 2,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "10+1.2*strength+2*level+1.5*attacking"
  },
  "guardianLaser": {
   "id": "guardianLaser",
   "name": "守护者激光",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 11,
   "mpCost": 60,
   "damageType": "Magical",
   "types": [
    "Damage"
   ],
   "states": [
    "guardianLaserResist"
   ],
   "value": "10+2*level"
  },
  "lavaBreath": {
   "id": "lavaBreath",
   "name": "熔岩吐息",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 35,
   "damageType": "Magical",
   "types": [
    "Damage"
   ],
   "states": [
    "burn"
   ],
   "value": "18+attacking*(1.1+.02*level)"
  },
  "dragonRoar": {
   "id": "dragonRoar",
   "name": "龙之咆哮",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 25,
   "damageType": "Physical",
   "types": [
    "Debuff",
    "Damage"
   ],
   "states": [
    "dragonRoarDebuff"
   ],
   "value": "8+1*(level)"
  },
  "doubleStrike": {
   "id": "doubleStrike",
   "name": "双重打击",
   "tire": 1,
   "target": "multi_random_enemy",
   "targetCount": 2,
   "colddown": 4,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "15+1.4*attacking+dexterity*(1.4+.02*level)"
  },
  "lowestHpStrike": {
   "id": "lowestHpStrike",
   "name": "弱点打击",
   "tire": 2,
   "target": "single_enemy",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "15+1*attacking+dexterity*(1.2+.03*level)"
  },
  "explosiveShot": {
   "id": "explosiveShot",
   "name": "爆炸射击",
   "tire": 2,
   "target": "multi_random_enemy",
   "targetCount": 3,
   "colddown": 6,
   "mpCost": 20,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "10+attacking*(1.5+.08*level)"
  },
  "freeze": {
   "id": "freeze",
   "name": "冻结",
   "tire": 1,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 25,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "frozen"
   ],
   "value": "6+1.1*intelligence+4*level"
  },
  "iceBomb": {
   "id": "iceBomb",
   "name": "冰弹",
   "tire": 1,
   "target": "multi_random_enemy",
   "targetCount": 2,
   "colddown": 3,
   "mpCost": 15,
   "damageType": "Physical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "frozen"
   ],
   "value": "8+1.5*attacking+4*level"
  },
  "lifeDrain": {
   "id": "lifeDrain",
   "name": "吸血",
   "tire": 2,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 40,
   "damageType": "Magical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "5+intelligence*(.6+.01*level)"
  },
  "roar": {
   "id": "roar",
   "name": "咆哮",
   "tire": 2,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 20,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "10+.8*strength+stamina*(1.2+.02*level)"
  },
  "blizzard": {
   "id": "blizzard",
   "name": "暴风雪",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 7,
   "mpCost": 30,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "frozen"
   ],
   "value": "6+intelligence*(.8+.04*level)"
  },
  "ironWall": {
   "id": "ironWall",
   "name": "铁壁",
   "tire": 1,
   "target": "self",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 5,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [
    "ironWall"
   ],
   "value": ".6*stamina"
  },
  "curse": {
   "id": "curse",
   "name": "诅咒",
   "tire": 1,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 10,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "curse"
   ],
   "value": null
  },
  "shadowBurst": {
   "id": "shadowBurst",
   "name": "暗影爆发",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 45,
   "damageType": "Magical",
   "types": [
    "Damage"
   ],
   "states": [
    "ancestorCrownRefreshSkill"
   ],
   "value": "18+.9*intelligence+3*level"
  },
  "groupCurse": {
   "id": "groupCurse",
   "name": "群体诅咒",
   "tire": 2,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 20,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "curse"
   ],
   "value": null
  },
  "holyLight": {
   "id": "holyLight",
   "name": "神圣之光",
   "tire": 2,
   "target": "single_random_ally",
   "targetCount": 1,
   "colddown": 6,
   "mpCost": 35,
   "damageType": "NoDamage",
   "types": [
    "Heal"
   ],
   "states": [],
   "value": "30+intelligence*(1.1+.02*level)"
  },
  "bless": {
   "id": "bless",
   "name": "祝福",
   "tire": 2,
   "target": "all_ally",
   "targetCount": 99,
   "colddown": 10,
   "mpCost": 25,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [
    "bless"
   ],
   "value": "6+intelligence*(.2+.01*level)"
  },
  "revive": {
   "id": "revive",
   "name": "复活",
   "tire": 3,
   "target": "single_random_ally",
   "targetCount": 1,
   "colddown": 20,
   "mpCost": 40,
   "damageType": "NoDamage",
   "types": [
    "Revive"
   ],
   "states": [],
   "value": "40+.6*intelligence+2*level"
  },
  "groupRegen": {
   "id": "groupRegen",
   "name": "群体再生",
   "tire": 2,
   "target": "all_ally",
   "targetCount": 99,
   "colddown": 7,
   "mpCost": 30,
   "damageType": "NoDamage",
   "types": [
    "Heal",
    "Buff"
   ],
   "states": [
    "regen"
   ],
   "value": "10+intelligence*(.3+.025*level)"
  },
  "astralBarrier": {
   "id": "astralBarrier",
   "name": "星辉结界",
   "tire": 2,
   "target": "all_ally",
   "targetCount": 99,
   "colddown": 7,
   "mpCost": 25,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [
    "astralBarrier"
   ],
   "value": "10+.5*intelligence+1*level"
  },
  "astralBlast": {
   "id": "astralBlast",
   "name": "星辉冲击",
   "tire": 2,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 8,
   "mpCost": 40,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "silence"
   ],
   "value": "16+intelligence*(.7+.01*level)"
  },
  "groupSilence": {
   "id": "groupSilence",
   "name": "群体沉默",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 12,
   "mpCost": 60,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "lastWord",
    "silence"
   ],
   "value": null
  },
  "selfRepair": {
   "id": "selfRepair",
   "name": "自我修复",
   "tire": 2,
   "target": "self",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 10,
   "damageType": "NoDamage",
   "types": [
    "Heal"
   ],
   "states": [],
   "value": "20+stamina*(1+.02*level)"
  },
  "cleanse": {
   "id": "cleanse",
   "name": "驱散",
   "tire": 2,
   "target": "single_random_ally",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 5,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [],
   "value": null
  },
  "cometStrike": {
   "id": "cometStrike",
   "name": "彗星打击",
   "tire": 2,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 20,
   "damageType": "Magical",
   "types": [
    "Debuff",
    "Damage"
   ],
   "states": [
    "silence"
   ],
   "value": "10+intelligence*(1.5+.04*level)"
  },
  "armorBreak": {
   "id": "armorBreak",
   "name": "破甲",
   "tire": 2,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "armorBreak"
   ],
   "value": "8+1*attacking+dexterity*(1.6+.03*level)"
  },
  "starTrap": {
   "id": "starTrap",
   "name": "星辰陷阱",
   "tire": 2,
   "target": "multi_random_enemy",
   "targetCount": 2,
   "colddown": 4,
   "mpCost": 15,
   "damageType": "Magical",
   "types": [
    "Debuff"
   ],
   "states": [
    "stun"
   ],
   "value": "10+intelligence*(1+.03*level)"
  },
  "emperorCatFinale_forAstralEmpressBoss": {
   "id": "emperorCatFinale_forAstralEmpressBoss",
   "name": "星辉终极裁决",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 14,
   "mpCost": 50,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "silence",
    "stun"
   ],
   "value": "30+1.2*intelligence+2*level"
  },
  "astralStorm": {
   "id": "astralStorm",
   "name": "星辉风暴",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 10,
   "mpCost": 35,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "silence",
    "stun"
   ],
   "value": "8+intelligence*(1.8+.02*level)"
  },
  "groupShield": {
   "id": "groupShield",
   "name": "群体护盾",
   "tire": 3,
   "target": "all_ally",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 15,
   "damageType": "NoDamage",
   "types": [
    "Shield"
   ],
   "states": [
    "shield"
   ],
   "value": "40+.3*intelligence+2*level"
  },
  "sneak": {
   "id": "sneak",
   "name": "潜行",
   "tire": 0,
   "target": "self",
   "targetCount": 1,
   "colddown": 6,
   "mpCost": 5,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [
    "sneak"
   ],
   "value": null
  },
  "ambush": {
   "id": "ambush",
   "name": "偷袭",
   "tire": 2,
   "target": "single_enemy",
   "targetCount": 1,
   "colddown": 2,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "10+1.2*attacking+dexterity*(1.2+.03*level)"
  },
  "poisonClaw": {
   "id": "poisonClaw",
   "name": "毒爪",
   "tire": 2,
   "target": "single_enemy",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "venom"
   ],
   "value": "25+.95*attacking+dexterity*(.95+.03*level)"
  },
  "shadowStep": {
   "id": "shadowStep",
   "name": "暗影步",
   "tire": 2,
   "target": "self",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 15,
   "damageType": "NoDamage",
   "types": [
    "Heal",
    "Buff"
   ],
   "states": [
    "sneak"
   ],
   "value": "8+.5*dexterity+.5*level"
  },
  "silenceStrike": {
   "id": "silenceStrike",
   "name": "沉默打击",
   "tire": 2,
   "target": "single_enemy",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "silence"
   ],
   "value": "15+1*attacking+dexterity*(1+.04*level)"
  },
  "slientSmokeScreen": {
   "id": "slientSmokeScreen",
   "name": "静默烟雾弹",
   "tire": 2,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 7,
   "mpCost": 5,
   "damageType": "NoDamage",
   "types": [
    "Debuff",
    "Buff"
   ],
   "states": [
    "sneak"
   ],
   "value": null
  },
  "mirrorImage": {
   "id": "mirrorImage",
   "name": "镜像影分身",
   "tire": 3,
   "target": "self",
   "targetCount": 1,
   "colddown": 7,
   "mpCost": 10,
   "damageType": "NoDamage",
   "types": [
    "Summon"
   ],
   "states": [
    "sneak"
   ],
   "value": null
  },
  "shadowAssassinUlt": {
   "id": "shadowAssassinUlt",
   "name": "绝影连杀",
   "tire": 3,
   "target": "multi_random_enemy",
   "targetCount": 4,
   "colddown": 8,
   "mpCost": 35,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [
    "sneak"
   ],
   "value": ".02*dexterity"
  },
  "stardustMouseSwap": {
   "id": "stardustMouseSwap",
   "name": "偷天换日",
   "tire": 2,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 8,
   "mpCost": 10,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [],
   "value": null
  },
  "dizzySpin": {
   "id": "dizzySpin",
   "name": "眩晕旋转",
   "tire": 2,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 5,
   "mpCost": 15,
   "damageType": "Physical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "stun"
   ],
   "value": "12+.6*attacking+strength*(.6+.02*level)"
  },
  "carouselOverdrive": {
   "id": "carouselOverdrive",
   "name": "失控加速",
   "tire": 2,
   "target": "self",
   "targetCount": 1,
   "colddown": 1,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "1.5*attacking+stamina*(2.5+.05*level)"
  },
  "candyBomb": {
   "id": "candyBomb",
   "name": "糖果爆裂",
   "tire": 2,
   "target": "multi_random_enemy",
   "targetCount": 2,
   "colddown": 5,
   "mpCost": 15,
   "damageType": "Physical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [],
   "value": "14+attacking*(.6+.02*level)+intelligence*(.6+.02*level)"
  },
  "prankSmoke": {
   "id": "prankSmoke",
   "name": "恶作剧烟雾",
   "tire": 2,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 8,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "fluster"
   ],
   "value": null
  },
  "mercenaryTaunt": {
   "id": "mercenaryTaunt",
   "name": "嘲讽",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 5,
   "mpCost": 12,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "taunt"
   ],
   "value": null
  },
  "plushTaunt": {
   "id": "plushTaunt",
   "name": "毛绒嘲讽",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 8,
   "mpCost": 12,
   "damageType": "NoDamage",
   "types": [
    "Buff",
    "Debuff"
   ],
   "states": [
    "defUp",
    "taunt"
   ],
   "value": null
  },
  "starlightSanctuary": {
   "id": "starlightSanctuary",
   "name": "星光治愈",
   "tire": 2,
   "target": "all_ally",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 16,
   "damageType": "NoDamage",
   "types": [
    "Heal"
   ],
   "states": [],
   "value": null
  },
  "ghostlyStrike": {
   "id": "ghostlyStrike",
   "name": "鬼影冲锋",
   "tire": 3,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 2,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "stun"
   ],
   "value": ".6*attacking+dexterity*(.8+.03*level)"
  },
  "paradeHorn": {
   "id": "paradeHorn",
   "name": "狂欢号角",
   "tire": 3,
   "target": "all_ally",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 20,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [
    "atkUp"
   ],
   "value": null
  },
  "clownSummon": {
   "id": "clownSummon",
   "name": "小丑召集令",
   "tire": 3,
   "target": "none",
   "targetCount": 0,
   "colddown": 8,
   "mpCost": 22,
   "damageType": "NoDamage",
   "types": [
    "Summon",
    "Heal"
   ],
   "states": [],
   "value": null
  },
  "kingAegis": {
   "id": "kingAegis",
   "name": "猫王庇护",
   "tire": 3,
   "target": "self",
   "targetCount": 1,
   "colddown": 7,
   "mpCost": 16,
   "damageType": "NoDamage",
   "types": [
    "Shield"
   ],
   "states": [
    "shield"
   ],
   "value": null
  },
  "sealMagic": {
   "id": "sealMagic",
   "name": "封印魔法",
   "tire": 2,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 15,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "skillSeal"
   ],
   "value": null
  },
  "banish": {
   "id": "banish",
   "name": "驱逐",
   "tire": 2,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 6,
   "mpCost": 18,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "banished"
   ],
   "value": "18+2*intelligence+8*level"
  },
  "bind": {
   "id": "bind",
   "name": "束缚",
   "tire": 1,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 10,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "frozen"
   ],
   "value": "10+.6*attacking"
  },
  "detectMagic": {
   "id": "detectMagic",
   "name": "识破魔法",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 5,
   "mpCost": 10,
   "damageType": "Magical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": null
  },
  "punish": {
   "id": "punish",
   "name": "惩戒",
   "tire": 3,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 12,
   "damageType": "Magical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": null
  },
  "confuse": {
   "id": "confuse",
   "name": "扰乱",
   "tire": 1,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 8,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "fluster"
   ],
   "value": null
  },
  "forbiddenMagic": {
   "id": "forbiddenMagic",
   "name": "禁忌魔法",
   "tire": 3,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 1,
   "mpCost": 35,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "fluster",
    "silence"
   ],
   "value": "40+1.4*intelligence"
  },
  "ultimateLibraryJudgement": {
   "id": "ultimateLibraryJudgement",
   "name": "禁魔审判",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 15,
   "mpCost": 80,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "banished",
    "silence",
    "skillSeal"
   ],
   "value": "120+2*intelligence+20*level"
  },
  "chainWhip": {
   "id": "chainWhip",
   "name": "锁链鞭打",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 8,
   "damageType": "Physical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [],
   "value": "15+.8*attacking+2*level"
  },
  "fearInduction": {
   "id": "fearInduction",
   "name": "恐惧",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 5,
   "mpCost": 12,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "fluster"
   ],
   "value": null
  },
  "soulDrain": {
   "id": "soulDrain",
   "name": "灵魂吸取",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 10,
   "mpCost": 15,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Heal"
   ],
   "states": [],
   "value": "20+1.2*intelligence+3*level"
  },
  "demonicRage": {
   "id": "demonicRage",
   "name": "恶魔狂怒",
   "tire": 0,
   "target": "self",
   "targetCount": 1,
   "colddown": 6,
   "mpCost": 20,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [
    "demonicRage"
   ],
   "value": null
  },
  "spectralClaw": {
   "id": "spectralClaw",
   "name": "幽灵利爪",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 2,
   "mpCost": 6,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "24+1*dexterity+2*level"
  },
  "hauntingWail": {
   "id": "hauntingWail",
   "name": "哀嚎怨声",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 4,
   "mpCost": 15,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "silence"
   ],
   "value": "10+.8*intelligence"
  },
  "vengeanceStrike": {
   "id": "vengeanceStrike",
   "name": "复仇一击",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 18,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "30+1.5*attacking+.8*targetMaxHp"
  },
  "despairAura": {
   "id": "despairAura",
   "name": "绝望光环",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 20,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "despair"
   ],
   "value": null
  },
  "phantomStrike": {
   "id": "phantomStrike",
   "name": "幽灵突击",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 12,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "25+1.5*dexterity+3*level"
  },
  "mentalBreak": {
   "id": "mentalBreak",
   "name": "精神崩溃",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 8,
   "mpCost": 25,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "fluster"
   ],
   "value": "15+1.8*intelligence+.5*intelligence"
  },
  "painAmplifier": {
   "id": "painAmplifier",
   "name": "痛苦放大",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 10,
   "damageType": "NoDamage",
   "types": [
    "Debuff"
   ],
   "states": [
    "painAmplified"
   ],
   "value": null
  },
  "tortureProtocol": {
   "id": "tortureProtocol",
   "name": "酷刑程序",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 2,
   "mpCost": 18,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "8+.8*attacking+2*level"
  },
  "mechanicalGrip": {
   "id": "mechanicalGrip",
   "name": "机械钳制",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 12,
   "damageType": "Physical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [
    "stun"
   ],
   "value": "18+1.2*attacking+2*level"
  },
  "shadowCorruption": {
   "id": "shadowCorruption",
   "name": "暗影腐蚀",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 6,
   "mpCost": 20,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [],
   "value": "35+1*attacking"
  },
  "nightmareSlam": {
   "id": "nightmareSlam",
   "name": "噩梦重击",
   "tire": 0,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 2,
   "mpCost": 15,
   "damageType": "Magical",
   "types": [
    "Damage",
    "Debuff"
   ],
   "states": [],
   "value": "45+1.8*attacking+1*strength"
  },
  "apocalypticRoar": {
   "id": "apocalypticRoar",
   "name": "末日咆哮",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 5,
   "mpCost": 20,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": "20+2*attacking+.8*targetMaxHp"
  },
  "prisonDomination": {
   "id": "prisonDomination",
   "name": "监狱统治",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 2,
   "mpCost": 40,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [
    "stun"
   ],
   "value": "35+1.5*attacking+8*level"
  },
  "darkRitual": {
   "id": "darkRitual",
   "name": "黑暗仪式",
   "tire": 0,
   "target": "self",
   "targetCount": 1,
   "colddown": 10,
   "mpCost": 60,
   "damageType": "NoDamage",
   "types": [
    "Buff",
    "Heal",
    "Summon"
   ],
   "states": [],
   "value": null
  },
  "strengthInKittyNumbers": {
   "id": "strengthInKittyNumbers",
   "name": "喵多势众",
   "tire": 0,
   "target": "single_enemy",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 0,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "value": null
  },
  "lightsOut": {
   "id": "lightsOut",
   "name": "熄灯",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 3,
   "mpCost": 25,
   "damageType": "Magical",
   "types": [
    "Damage"
   ],
   "states": [
    "fluster"
   ],
   "value": null
  }
 }
};
