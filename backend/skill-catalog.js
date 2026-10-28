// 自动生成，勿手改：python backend/tools/gen-skill-catalog.py
// 数据来源：pulled-frontend/_nuxt/game-battle-skill-I4Ckwbp2.js 的 yl/hl/pl/bl 四张技能表
// value：直接伤害/治疗/护盾的算式（变量已换成属性名），后端用 new Function 求值。
// stateValues：技能挂的状态及强度算式（参考站的 thisStateActuralValue）。
// neverCast：参考站里 preCheck 恒假、或依赖未实装系统（召唤/菜谱）的技能。
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
   "stateValues": [],
   "value": null,
   "effectStr": "对随机敌人进行普通攻击，基于你的攻击力与对方防御力，造成伤害",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "boneShield",
     "duration": 3,
     "value": "(8+.5*(level))"
    }
   ],
   "value": null,
   "effectStr": "提升（8+技能等级*0.5）防御，持续3回合。\n接下来受到的3次伤害，降低至1点，触发3次后结束骨盾效果。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "corrosiveBreath",
     "duration": 3,
     "value": null
    }
   ],
   "value": "5*attacking",
   "effectStr": "向生命值最高的敌人喷吐腐蚀液体，造成(6 + 目标最大生命值5% + 攻击80% + 技能等级*0.25)点无视防御的伤害，使其防御-6，持续3回合。\n伤害不会超过自身攻击力的500%。",
   "table": "yl"
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
   "stateValues": [],
   "value": "5+.1*attacking+.2*level",
   "effectStr": "召唤浆果鸟为你战斗，其攻击为（5+攻击10%+技能等级*0.2），持续3回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "10+intelligence+4*(level)",
   "effectStr": "治疗生命值最低的受伤友方单位，回复(10 + 智力*100% + 技能等级*4)点生命值",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "poison",
     "duration": 6,
     "value": "(15+intelligence*(.3+.03*(level)))"
    }
   ],
   "value": null,
   "effectStr": "为一个随机未中毒的敌人附加中毒状态（每回合开始时受到(15 + 智力(30 + 技能等级*3)%)点伤害，持续6回合）",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "selfHeal",
     "duration": 3,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "为一个随机未拥有自愈状态的友方附加自我疗愈状态\n每回合开始时回复(5 + 释放者智力30% + 技能等级*4)点生命，持续3回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "10+Math.floor(attacking*(.8+.01*level)+strength*(.5+.01*level))",
   "effectStr": "对所有敌人造成(10 + 攻击力(80 + 技能等级*1)% + 力量(50 + 技能等级*1)%)点伤害",
   "table": "yl"
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
   "stateValues": [],
   "value": "10+.6*intelligence+2*(level)",
   "effectStr": "为所有友方单位回复(10 + 智力60% + 技能等级*2)点生命值",
   "table": "yl"
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
   "stateValues": [],
   "value": "10+1.2*strength+2*level+1.5*attacking",
   "effectStr": "对行动顺序最前方的敌人造成(10 + 力量120% + 攻击力150% + 技能等级*2)点伤害，忽略50%防御。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "guardianLaserResist",
     "duration": 2,
     "value": null
    }
   ],
   "value": "10+2*level",
   "effectStr": "对所有敌人造成(10 + 目标当前生命值(15 + 技能等级*0.15)% + 技能等级*2)点伤害，忽略30%防御值，并对其施加“激光抵抗”\n该伤害不会使目标生命值低于1点。\n该伤害中，对当前生命值进行计算的部分，伤害不会超过自身攻击力500%",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "burn",
     "duration": 4,
     "value": null
    }
   ],
   "value": "18+attacking*(1.1+.02*level)",
   "effectStr": "对所有敌人造成(18 + 攻击力(110 + 技能等级*2)%)点伤害\n并有40%概率使目标灼烧，持续4回合）",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "dragonRoarDebuff",
     "duration": 1,
     "value": "(Math.floor(8+1*(level)))"
    }
   ],
   "value": "8+1*(level)",
   "effectStr": "震慑所有敌人，造成（自身最大生命值40% + 耐力130%）的伤害，并使其攻击、防御降低(8 + 技能等级*1)，持续1回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "15+1.4*attacking+dexterity*(1.4+.02*level)",
   "effectStr": "对随机两个敌人各造成(15 + 敏捷140% + 攻击力(140 + 技能等级*2)%)点伤害",
   "table": "yl"
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
   "stateValues": [],
   "value": "15+1*attacking+dexterity*(1.2+.03*level)",
   "effectStr": "对生命值最低的敌人造成(15 + 攻击力100% + 敏捷(120 + 技能等级*3)%)点伤害，目标每失去10%生命值，伤害增加（攻击力20%）点",
   "table": "yl"
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
   "stateValues": [],
   "value": "10+attacking*(1.5+.08*level)",
   "effectStr": "对随机一个主要目标造成(10 + 攻击力(150 + 技能等级*8)%点伤害\n对另外两个敌人各造成(10 + 攻击力(80 + 技能等级*4)%)点伤害",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "frozen",
     "duration": 1,
     "value": null
    }
   ],
   "value": "6+1.1*intelligence+4*level",
   "effectStr": "对随机敌人造成(6 + 智力110% + 技能等级*4)点伤害，并有(30% + 技能等级*1)概率使其冻结（跳过下回合）",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "frozen",
     "duration": 2,
     "value": null
    }
   ],
   "value": "8+1.5*attacking+4*level",
   "effectStr": "对随机两个敌人各造成(8 + 攻击力150% + 技能等级*4)点伤害，并有40%概率造成2回合冻结",
   "table": "yl"
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
   "stateValues": [],
   "value": "5+intelligence*(.6+.01*level)",
   "effectStr": "对随机敌人造成(5 + 智力(80 + 技能等级*1)%)点伤害，无视防御，并为自身回复与最终伤害等量的生命值",
   "table": "yl"
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
   "stateValues": [],
   "value": "10+.8*strength+stamina*(1.2+.02*level)",
   "effectStr": "对所有敌人造成(10 + 力量80% + 耐力(120 + 技能等级*2)%)点伤害，忽视50%防御",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "frozen",
     "duration": 1,
     "value": null
    }
   ],
   "value": "6+intelligence*(.8+.04*level)",
   "effectStr": "对所有敌人造成(6 + 智力(80 + 技能等级*4)%)点伤害，并有(30 + 技能等级*0.8)%概率冻结目标",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "ironWall",
     "duration": 3,
     "value": "(5+Math.floor(.6*stamina)+(level))"
    }
   ],
   "value": ".6*stamina",
   "effectStr": "提升防御，数值相当于(5 + 耐力*60% + 技能等级*1）”，持续3回合。期间受到的所有降低30%",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "curse",
     "duration": 3,
     "value": "(6+(level))"
    }
   ],
   "value": null,
   "effectStr": "使随机目标虚弱，攻击、防御降低（6 + 技能等级*1），持续3回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "ancestorCrownRefreshSkill",
     "duration": 2,
     "value": null
    }
   ],
   "value": "18+.9*intelligence+3*level",
   "effectStr": "对所有敌人造成(18 + 智力90% + 技能等级*3)点伤害，对生命值高于70%的单位造成额外智力50%伤害",
   "table": "yl"
  },
  "groupCurse": {
   "id": "groupCurse",
   "name": "群体诅咒",
   "tire": 2,
   "target": "all_enemy",
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
   "stateValues": [
    {
     "stateId": "curse",
     "duration": 3,
     "value": "(6+(level))"
    }
   ],
   "value": null,
   "effectStr": "诅咒敌方全体，使其虚弱，攻击、防御降低（6 + 技能等级*1），持续3回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "30+intelligence*(1.1+.02*level)",
   "effectStr": "为一名生命值最低的友方单位回复(30 + 智力(110 + 技能等级*2)%)点生命，为其余友军恢复(10 + 智力(65 + 技能等级*1)%)点生命。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "bless",
     "duration": 3,
     "value": null
    }
   ],
   "value": "6+intelligence*(.2+.01*level)",
   "effectStr": "为所有友方单位提升攻击与防御(6 + 智力(20 + 技能等级*1)%)，持续3回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "40+.6*intelligence+2*level",
   "effectStr": "随机复活一名阵亡友方单位，并回复其(40 + 智力60% + 技能等级*1)点生命，30%的魔法值，复活后清除所有状态。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "regen",
     "duration": 3,
     "value": null
    }
   ],
   "value": "10+intelligence*(.3+.025*level)",
   "effectStr": "为所有友方单位附加再生状态(每回合回复10 + 智力(35 + 技能等级*2.5)%)点生命，持续3回合）",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "astralBarrier",
     "duration": 3,
     "value": null
    }
   ],
   "value": "10+.5*intelligence+1*level",
   "effectStr": "为所有友方单位提升防御（10 + 智力50% + 技能等级*1）,并使他们受到的第一次超过最大生命值30%的伤害降低至0，持续3回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "silence",
     "duration": 2,
     "value": null
    }
   ],
   "value": "16+intelligence*(.7+.01*level)",
   "effectStr": "对所有敌人造成(8 + 智力(70 + 技能等级*1.5)%)点魔法伤害，并有(30 + 技能等级*1)%概率使目标沉默（2回合，无法释放技能）",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "silence",
     "duration": 2,
     "value": null
    },
    {
     "stateId": "lastWord",
     "duration": 3,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "使所有敌人有(40% + 智力50% + 技能等级*1)概率沉默，持续2回合\n未被沉默的敌人获得“遗言”，持续3回合。",
   "table": "yl"
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
   "stateValues": [],
   "value": "20+stamina*(1+.02*level)",
   "effectStr": "为自身回复(20 + 耐力(100% + 技能等级*2)%)点生命，并移除一个随机的负面状态",
   "table": "yl"
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
   "stateValues": [],
   "value": null,
   "effectStr": "为随机一名有负面状态的友方单位移除所有负面状态",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "silence",
     "duration": 2,
     "value": null
    }
   ],
   "value": "10+intelligence*(1.5+.04*level)",
   "effectStr": "对随机敌人造成(10 + 智力(130 + 技能等级*4)%)点伤害，并有40%概率使目标沉默2回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "armorBreak",
     "duration": 2,
     "value": "(Math.floor(.3*defencing))"
    }
   ],
   "value": "8+1*attacking+dexterity*(1.6+.03*level)",
   "effectStr": "对防御最高的敌人造成(12 + 攻击力100% + 敏捷(160 + 技能等级*3)%)点伤害，忽略50%防御，然后使其防御-30%，持续2回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "stun",
     "duration": 2,
     "value": null
    }
   ],
   "value": "10+intelligence*(1+.03*level)",
   "effectStr": "对随机两个敌人造成(10 + 智力(100% + 技能等级*3)%)点伤害，并有50%概率使其眩晕2回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "silence",
     "duration": 2,
     "value": null
    },
    {
     "stateId": "stun",
     "duration": 2,
     "value": null
    }
   ],
   "value": "30+1.2*intelligence+2*level",
   "effectStr": "对所有敌人造成500 + (30 + 智力120% + 技能等级*2)点魔法伤害，此伤害将均摊给所有敌人，每个目标都有40%几率因此被沉默、眩晕，持续2回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "silence",
     "duration": 2,
     "value": null
    },
    {
     "stateId": "stun",
     "duration": 2,
     "value": null
    }
   ],
   "value": "8+intelligence*(1.8+.02*level)",
   "effectStr": "对所有敌人造成(40 + 智力(160 + 技能等级*2)%)点魔法伤害，并有(50 + 技能等级*2)%概率使目标沉默和眩晕各2回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "shield",
     "duration": 2,
     "value": null
    }
   ],
   "value": "40+.3*intelligence+2*level",
   "effectStr": "为所有友方单位添加一个可吸收伤害的护盾（护盾值=40+智力30%+技能等级*2），持续2回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "sneak",
     "duration": 3,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "进入潜行状态，3回合内无法被敌人选为目标（群体技能不受影响）。",
   "table": "yl"
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
   "stateValues": [],
   "value": "10+1.2*attacking+dexterity*(1.2+.03*level)",
   "effectStr": "对生命值最低的敌人造成(10 + 攻击力120% + 敏捷(120 + 技能等级*3)%)点伤害\n若目标生命值低于50%则此伤害额外提升50%\n若自身处于潜行状态下，则此伤害还将额外提升50%。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "venom",
     "duration": 3,
     "value": "(Math.ceil(.15*defencing))"
    }
   ],
   "value": "25+.95*attacking+dexterity*(.95+.03*level)",
   "effectStr": "对生命值最低的敌人造成(25 + 攻击力95% + 敏捷(95 + 技能等级*3)%)点伤害\n并使目标获得剧毒（失去15%护甲，每回合受到(15+15%当前生命)点伤害，持续3回合）。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "sneak",
     "duration": 2,
     "value": null
    }
   ],
   "value": "8+.5*dexterity+.5*level",
   "effectStr": "立即进入潜行状态（2回合），并回复(8 + 敏捷(50 + 技能等级*5)%)点生命值。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "silence",
     "duration": 2,
     "value": null
    }
   ],
   "value": "15+1*attacking+dexterity*(1+.04*level)",
   "effectStr": "对技能最多的敌人造成(15 + 攻击力100% + (敏捷100% + 技能等级*4)%)点伤害，并沉默2回合（无法释放技能）。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "sneak",
     "duration": 2,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "所有敌人一个随机技能进入3回合冷却，自身进入潜行状态（2回合）。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "sneak",
     "duration": 2,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "制造一个基础自身完整属性的，且拥有1回合隐匿的影分身\n分身只有1点生命值，持续4回合。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "sneak",
     "duration": 2,
     "value": null
    }
   ],
   "value": ".02*dexterity",
   "effectStr": "在敌阵中高速穿梭，对敌人进行(5 + (敏捷*0.02，向下取整))次标记（优先选择不同目标）\n，每被标记1次，都将受到(攻击120% + 敏捷(120 + 技能等级*4)%)点伤害\n若目标生命值低于50%，则本次攻击伤害翻倍。\n若自身处于潜行状态，则结束潜行。\n若自身不处于潜行，则进入潜行状态，持续2回合。",
   "table": "yl"
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
   "stateValues": [],
   "value": null,
   "effectStr": "从（1+智力10%）名敌人身上各偷取(1+智力10%)个可移除的随机增益状态并转移给自己，该敌有100%几率进入慌乱状态（所有的行为将不分敌我），持续2回合。\n目标每点智力降低2%被慌乱的几率。",
   "table": "yl",
   "neverCast": true
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
   "stateValues": [
    {
     "stateId": "stun",
     "duration": 1,
     "value": null
    }
   ],
   "value": "12+.6*attacking+strength*(.6+.02*level)",
   "effectStr": "对所有敌人造成(12 + 攻击力60% + 力量(60 + 技能等级*2)% + 此敌人耐力120%)伤害，并有(40%+技能等级*1)概率眩晕1回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "1.5*attacking+stamina*(2.5+.05*level)",
   "effectStr": "对随机单位（不分敌我）造成(攻击力150% + 耐力(250 + 技能等级*5)%)的伤害\n如果此次攻击的是友军，额外对一个随机敌人造成(攻击力200% + 耐力(300 + 技能等级*5)% + 自身最大生命值30%)伤害",
   "table": "yl"
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
   "stateValues": [],
   "value": "14+attacking*(.6+.02*level)+intelligence*(.6+.02*level)",
   "effectStr": "随机两名敌人各造成(14 + 攻击力(60 + 技能等级*2)% + (智力60 + 技能等级*2)%)点伤害，并有（40%+技能等级*1）概率使目标获得一个随机负面状态（剧毒、眩晕、沉默、灼烧），持续2回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "fluster",
     "duration": 2,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "使所有敌人进入恐慌状态（行动目标随机，持续2回合）\n敌人每有1点智力，恐慌几率降低2%",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "taunt",
     "duration": 3,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "嘲讽所有敌人，持续3回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "taunt",
     "duration": 3,
     "value": null
    },
    {
     "stateId": "defUp",
     "duration": 3,
     "value": "15+1*(level)"
    }
   ],
   "value": null,
   "effectStr": "嘲讽所有敌人（选择敌人作为目标时，优先选择嘲讽来源），持续3回合，并提升自身防御(15+技能等级*1)，持续2回合",
   "table": "yl"
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
   "stateValues": [],
   "value": ".8*intelligence+(targetMaxHp-targetHp)*(.15+.005*level)",
   "effectStr": "为所有友军回复(智力80% + (15 + 技能等级*0.5)%已损失生命)点生命，并驱散一个随机负面效果",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "stun",
     "duration": 1,
     "value": null
    }
   ],
   "value": ".6*attacking+dexterity*(.8+.03*level)",
   "effectStr": "对一名当前生命值最低敌人造成(攻击力60%+敏捷(80 + 技能等级*3)%)伤害，忽略20%护甲\n对最大生命值最低的敌人造成(攻击力60%+敏捷(80 + 技能等级*3)%)伤害，有20%概率造成1回合眩晕\n如果选中了同一目标，则额外造成(攻击力60%+敏捷(80 + 技能等级*3)%)伤害",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "atkUp",
     "duration": 4,
     "value": "20+level"
    }
   ],
   "value": null,
   "effectStr": "为所有友军提升攻击（20 + 技能等级*1），持续4回合",
   "table": "yl"
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
   "stateValues": [],
   "value": null,
   "effectStr": "召唤(1+技能等级*0.4)只糖果小丑猫助战，持续10回合，若己方已存在小丑猫，则为所有小丑猫回复(最大生命值30%)生命",
   "table": "yl"
  },
  "kingAegis": {
   "id": "kingAegis",
   "name": "猫王庇护",
   "tire": 3,
   "target": "all_ally",
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
   "stateValues": [
    {
     "stateId": "shield",
     "duration": 2,
     "value": "(Math.floor(targetMaxHp*(.15+.005*(level))))"
    }
   ],
   "value": "targetMaxHp*(.15+.005*(level))",
   "effectStr": "为所有友军添加护盾，数额等于目标最大生命值(15 + 技能等级*0.5)%，持续3回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "skillSeal",
     "duration": 4,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "对一名技能最多的敌人造成(12 + 智力(140 + 技能等级*5)% + 此敌人技能数量*45）伤害\n对所有拥有正在冷却中技能的敌人，对其施加技能封印（技能冷却暂停，持续4回合）",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "banished",
     "duration": 3,
     "value": null
    }
   ],
   "value": "18+2*intelligence+8*level",
   "effectStr": "对一名随机敌人造成(18 + 智力200% + 技能等级*8)无视防御的伤害，并有50%概率为其附加“驱逐”，持续3回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "frozen",
     "duration": 1,
     "value": null
    }
   ],
   "value": "10+.6*attacking",
   "effectStr": "对一名敌人造成(10 + 攻击力60%)伤害，并使其无法行动（1回合）",
   "table": "yl"
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
   "stateValues": [],
   "value": null,
   "effectStr": "移除所有敌人1个随机增益状态，并对每个敌人造成(8 + 智力60% + 共驱散状态数量 * 10 + 技能等级 * 5)伤害，无视50%防御",
   "table": "yl"
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
   "stateValues": [],
   "value": "(14+.7*intelligence+1.3*targetIntelligence)",
   "effectStr": "对一名随机敌人造成(14 + 智力70% + 目标智力130%)伤害。\n若其拥有增益状态则额外造成(智力50% + 目标智力70%)伤害，且使此技能的伤害无视防御",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "fluster",
     "duration": 4,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "使一名敌人进入‘慌乱’状态，持续4回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "silence",
     "duration": 2,
     "value": null
    },
    {
     "stateId": "fluster",
     "duration": 3,
     "value": null
    }
   ],
   "value": "40+1.4*intelligence",
   "effectStr": "失去(10 + 当前生命值的10%)点生命值，对所有敌人造成(40 + 智力140% + 技能等级*8)伤害，并有30%概率沉默2回合\n自身被扰乱3回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "silence",
     "duration": 3,
     "value": null
    },
    {
     "stateId": "skillSeal",
     "duration": 3,
     "value": null
    },
    {
     "stateId": "banished",
     "duration": 3,
     "value": null
    }
   ],
   "value": "120+2*intelligence+20*level",
   "effectStr": "对所有敌人造成(120 + 智力200% + 技能等级*20)点真实伤害，移除所有增益状态，并有60%概率沉默、50%概率封印技能、40%概率驱逐，持续3回合。",
   "table": "yl"
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
   "stateValues": [],
   "value": "15+.8*attacking+2*level",
   "effectStr": "用锁链鞭打行动顺序最前的敌人，造成(15 + 攻击力80% + 技能等级*2)点伤害，并有50%概率将其行动顺序向后移动1轮",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "fluster",
     "duration": 3,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "恐吓直面自己的敌人，对行动顺序最前的敌人施加慌乱状态，持续3回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "20+1.2*intelligence+3*level",
   "effectStr": "吸取敌人的灵魂，造成(20 + 智力120% + 技能等级*3)点无视防御伤害，并回复等量生命值",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "demonicRage",
     "duration": 4,
     "value": "100+(level)"
    }
   ],
   "value": null,
   "effectStr": "进入狂怒状态，提升自身(100 + 技能等级)点攻击力，但防御力变为0，持续4回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "24+1*dexterity+2*level",
   "effectStr": "用幽灵化的利爪快速攻击目标，造成(24 + 敏捷100% + 技能等级*2)点伤害，忽略30%防御",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "silence",
     "duration": 2,
     "value": null
    }
   ],
   "value": "10+.8*intelligence",
   "effectStr": "发出怨恨的哀嚎，对所有敌人造成(10 + 智力80%)点伤害，并有70%概率使其沉默2回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "30+1.5*attacking+.8*targetMaxHp",
   "effectStr": "释放复仇之力，造成(30 + 攻击力150% + 自身已损失生命值80%)点伤害",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "despair",
     "duration": 3,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "散发绝望的气息，使所有敌人陷入绝望状态（每回合开始时损失5%最大生命值），持续3回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "25+1.5*dexterity+3*level",
   "effectStr": "如幽灵般突然出现攻击行动顺序最后的敌人，造成(25 + 敏捷150% + 技能等级*3)点伤害，忽略50%防御，并使其移动至行动顺序第一位",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "fluster",
     "duration": 2,
     "value": null
    }
   ],
   "value": "15+1.8*intelligence+.5*targetIntelligence",
   "effectStr": "对随机3个敌人施加精神攻击，造成(15 + 目标智力150%)点精神伤害，并有60%概率使其陷入慌乱状态，持续2回合",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "painAmplified",
     "duration": 3,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "对随机敌人施加痛苦放大状态，使其每次受到伤害时额外受到10%当前生命值的伤害，持续3回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "8+.8*attacking+2*level",
   "effectStr": "对所有敌人造成(8 + 攻击力80% + 技能等级 * 2)点伤害",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "stun",
     "duration": 3,
     "value": null
    }
   ],
   "value": "18+1.2*attacking+2*level",
   "effectStr": "用机械臂钳制敏捷最低的敌人，造成(18 + 攻击力120% + 技能等级*2)点伤害，并使其眩晕3回合",
   "table": "yl"
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
   "stateValues": [],
   "value": "35+1*attacking",
   "effectStr": "用暗影力量腐蚀行动顺序最后的敌人，造成(35 + 攻击力100%)点伤害，其行动顺序前每有一个单位，额外造成(目标已损失生命值15%)点伤害",
   "table": "yl"
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
   "stateValues": [],
   "value": "45+1.8*attacking+1*strength",
   "effectStr": "用噩梦之力重击行动顺序最前方的敌人，造成(45 + 攻击力180% + 力量100%)点伤害，并将其行动顺序向后移动1轮",
   "table": "yl"
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
   "stateValues": [],
   "value": "20+2*attacking+.8*targetMaxHp",
   "effectStr": "发出震撼灵魂的末日咆哮，对所有敌人造成(20 + 攻击力200% + 自身已损失生命值50%)点伤害",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "stun",
     "duration": 2,
     "value": null
    }
   ],
   "value": "35+1.5*attacking+8*level",
   "effectStr": "展现霸主威严，对所有敌人造成(35 + 攻击力150% + 技能等级*8)点伤害",
   "table": "yl"
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
   "stateValues": [],
   "value": null,
   "effectStr": "进行黑暗仪式，己方每阵亡一个单位，回复自身(最大生命值15%)点生命值，并永久提升10点攻击力。\n每一个阵亡的友军还将额外召唤一个绝望幻影，持续5回合",
   "table": "yl"
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
   "stateValues": [],
   "value": null,
   "effectStr": "对一个随机敌人造成攻击力100%的伤害\n己方阵营每存在1个非召唤物的单位，此伤害提高50%。",
   "table": "yl"
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
   "stateValues": [
    {
     "stateId": "fluster",
     "duration": 2,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "为所有单位施加“扰乱”，持续1回合",
   "table": "yl"
  },
  "beastpackRoar": {
   "id": "beastpackRoar",
   "name": "兽群咆哮",
   "tire": 4,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 5,
   "mpCost": 30,
   "damageType": "Physical",
   "types": [
    "Buff",
    "Damage",
    "Debuff"
   ],
   "states": [],
   "stateValues": [],
   "value": "(10+farmingAnimal*(8.5+.5*level)+defencing*(2.5+.5*level))",
   "effectStr": "对所有敌人造成(10 + 畜牧等级(850 + 技能等级*50)% + 防御力(250 + 技能等级*50)%)点伤害。\n友方每存在一个召唤物，总伤害额外提升(畜牧等级 * 0.75)%。",
   "table": "hl"
  },
  "chefSkill": {
   "id": "chefSkill",
   "name": "爆炒",
   "tire": 4,
   "target": "self",
   "targetCount": 1,
   "colddown": 4,
   "mpCost": 40,
   "damageType": "Magical",
   "types": [
    "Buff",
    "Damage",
    "Debuff"
   ],
   "states": [],
   "stateValues": [],
   "value": null,
   "effectStr": "根据你调配的风味，产生不同影响",
   "table": "hl",
   "neverCast": true
  },
  "forgeSkillCraftMeowColossus": {
   "id": "forgeSkillCraftMeowColossus",
   "name": "制造喵喵巨像",
   "tire": 4,
   "target": "self",
   "targetCount": 1,
   "colddown": 1,
   "mpCost": 12,
   "damageType": "NoDamage",
   "types": [
    "Summon"
   ],
   "states": [
    "forgeSkillCraftMeowColossusState"
   ],
   "stateValues": [
    {
     "stateId": "forgeSkillCraftMeowColossusState",
     "duration": 999,
     "value": null
    }
   ],
   "value": "1+.1*forging",
   "effectStr": "使用此技能将为场上的“喵喵巨像”提供(1+锻造等级10%, 向下取整)层充能。\n如果“喵喵巨像”不存在, 则制造一个喵喵巨像来协助作战, 喵喵巨像初始拥有100最大生命值, 30攻击, 10防御。你的队伍中每拥有1级“锻造”等级, 将额外提供8生命、1攻击、1防御。\n喵喵巨像不视为任何人的召唤物，喵喵巨像可跨战斗存在",
   "table": "hl",
   "neverCast": true
  },
  "forgeSkillCraftTurret": {
   "id": "forgeSkillCraftTurret",
   "name": "制造炮台",
   "tire": 4,
   "target": "self",
   "targetCount": 1,
   "colddown": 1,
   "mpCost": 5,
   "damageType": "NoDamage",
   "types": [
    "Summon"
   ],
   "states": [
    "forgeSkillCraftTurretUpgrade"
   ],
   "stateValues": [
    {
     "stateId": "forgeSkillCraftTurretUpgrade",
     "duration": 999,
     "value": null
    }
   ],
   "value": "2*forging",
   "effectStr": "召唤一个不占用回合的自动炮台，炮台将在你的回合开始时，对一个随机目标发射炮弹，造成炮台攻击力100%的伤害。\n炮台拥有(20 + 锻造等级400%)的攻击力，(10 + 锻造等级100%)的防御，(50 + 锻造等级200%)的生命值，且能够跨战斗存在\n你只能拥有1个炮台，当你释放此技能时，如果场上已有属于你的炮台，则会对现有的炮台进行升级，为其恢复全部生命值，移除1个负面状态，并额外为其增加(锻造等级200%)攻击力、(锻造等级50%)防御与(锻造等级100%)生命值，最多升级10次。",
   "table": "hl",
   "neverCast": true
  },
  "natureGift": {
   "id": "natureGift",
   "name": "自然馈赠",
   "tire": 4,
   "target": "all_ally",
   "targetCount": 999,
   "colddown": 15,
   "mpCost": 20,
   "damageType": "NoDamage",
   "types": [
    "Heal",
    "Buff"
   ],
   "states": [
    "natureGift"
   ],
   "stateValues": [
    {
     "stateId": "natureGift",
     "duration": 10,
     "value": "8e-4*(collecting)"
    }
   ],
   "value": "10+.4*intelligence+collecting*(1+.02*level)",
   "effectStr": "为全体友军回复(10 + 智力40% + 采集等级(100% + 技能等级*2)%)生命，并附加“自然时运”效果，持续10回合。\n自然时运提升(采集等级 * 0.08)%战利品掉落率（例：释放者有30采集等级，则提升2.4%掉落率[*102.4%]）",
   "table": "hl"
  },
  "threadingNeedle": {
   "id": "threadingNeedle",
   "name": "穿针引线",
   "tire": 4,
   "target": "single_random_enemy",
   "targetCount": 1,
   "colddown": 6,
   "mpCost": 25,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [],
   "stateValues": [],
   "value": "10+attacking*(.6+.02*level)+sewing*(3.5+.02*level)",
   "effectStr": "根据敌人的行动顺序，对所有敌人依次造成伤害，伤害为（10 + 攻击力(60 + 技能等级*2)% + 缝纫等级(350 + 技能等级*2)%)点伤害，无视防御。\n每伤害一个敌人，伤害降低5%。",
   "table": "hl"
  },
  "knowledgeInspiration": {
   "id": "knowledgeInspiration",
   "name": "知识启迪",
   "tire": 4,
   "target": "all_ally",
   "targetCount": 9999,
   "colddown": 10,
   "mpCost": 30,
   "damageType": "NoDamage",
   "types": [
    "MpRegen"
   ],
   "states": [
    "knowledgeInspirationState"
   ],
   "stateValues": [
    {
     "stateId": "knowledgeInspirationState",
     "duration": 4,
     "value": null
    }
   ],
   "value": "10+knowledge*(.4+.01*level)",
   "effectStr": "减少所有友方单位的技能冷却时间(0 + 学识等级3.4%)回合，恢复所有友方单位(10 + 学识等级(40 + 技能等级*1)%)点魔法。\n每个单位在4回合内只会受到1次来自此技能的冷却缩减效果。\n冷却缩减效果不会影响“知识启迪”。",
   "table": "hl"
  },
  "sowMelonsReapMelons": {
   "id": "sowMelonsReapMelons",
   "name": "种瓜得瓜",
   "tire": 4,
   "target": "single_random_ally",
   "targetCount": 1,
   "colddown": 3,
   "mpCost": 0,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [],
   "stateValues": [],
   "value": "1+.1*farmingPlant",
   "effectStr": "为随机(0 + 种植等级10%)个不处于“种瓜得瓜“状态的友方单位添加”种瓜得瓜“状态，持续4回合。\n如果至少为一个友军施加了“种瓜得瓜”，自身获得随机(1 + 技能等级5%)点生活技能经验值（采集、采矿、钓鱼、畜牧、种植）,每额外施加一个，额外获得1经验。",
   "table": "hl"
  },
  "enhanceEmpower": {
   "id": "enhanceEmpower",
   "name": "强化赋能",
   "tire": 4,
   "target": "single_random_ally",
   "targetCount": 1,
   "colddown": 11,
   "mpCost": 40,
   "damageType": "NoDamage",
   "types": [
    "Buff"
   ],
   "states": [
    "enhanceEmpowerState"
   ],
   "stateValues": [
    {
     "stateId": "enhanceEmpowerState",
     "duration": 5,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "为当前不处于“强化赋能“状态的友军中，装备强化总等级最高的友军施加“强化赋能”效果，持续5回合。\n强化赋能给予其(释放者强化等级20% + 技能等级30%)点属性，附加至其当前最高的属性(力量、敏捷、智力)上。对于其穿戴的每件强化过的装备，每1强化等级都额外提供(0.1 + 释放者强化等级0.8%)点属性。",
   "table": "hl"
  },
  "enhanceStrike": {
   "id": "enhanceStrike",
   "name": "强化冲击",
   "tire": 4,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 6,
   "mpCost": 30,
   "damageType": "NoDamage",
   "types": [
    "Damage"
   ],
   "states": [],
   "stateValues": [],
   "value": ".6*intelligence+enhance*(2+.02*level)",
   "effectStr": "对所有敌人造成伤害，数值相当于((攻击力或智力)60% + 强化等级(200 + 技能等级*2)%)点伤害。自身穿戴的装备，每1级强化等级都会使最终伤害额外提升2.5%。\n伤害类型及取值取决于角色属性，智力属性比力量、敏捷高时，造成魔法伤害，否则造成物理伤害。",
   "table": "hl"
  },
  "fishmanSkill": {
   "id": "fishmanSkill",
   "name": "fishmanSkill",
   "tire": 4,
   "target": "self",
   "targetCount": 1,
   "colddown": 1,
   "mpCost": 20,
   "damageType": "NoDamage",
   "types": [
    "Heal",
    "Buff"
   ],
   "states": [],
   "stateValues": [],
   "value": null,
   "effectStr": "向随机一名没有受到“上钩了”影响的敌人甩出鱼竿，使自身与目标无法行动2回合。\n2回合后，对目标造成(钓鱼等级*1000% + 技能等级*5)点伤害。\n如果目标因此伤害阵亡，你有(钓鱼等级*0.5)%的概率立即触发一次此敌人的掉落检测。\n如果目标提前阵亡，你有(钓鱼等级*0.25)%的概率立即触发一次此敌人的掉落检测。\n因此技能获得的掉落物仅对你生效\n此技能触发的掉落概率受幸运及其他来源的掉落率变动影响，但不受“战场后勤猫猫”的影响",
   "table": "hl",
   "neverCast": true
  },
  "meowColossusLaser": {
   "id": "meowColossusLaser",
   "name": "巨像激光",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 99,
   "colddown": 3,
   "mpCost": 0,
   "damageType": "Magical",
   "types": [
    "Damage"
   ],
   "states": [],
   "stateValues": [],
   "value": null,
   "effectStr": "对所有敌人造成(10 + 攻击力230% + 目标当前生命值10%)点伤害, 这次伤害拥有50%防御穿透\n拥有50层“巨像充能”时, 将造成2次伤害\n巨像激光造成的伤害不会超过自身攻击力的1000%",
   "table": "pl",
   "neverCast": true
  },
  "denseFogSpriteAttack": {
   "id": "denseFogSpriteAttack",
   "name": "迷雾幽灵攻击",
   "tire": 0,
   "target": "all",
   "targetCount": 99,
   "colddown": 0,
   "mpCost": 0,
   "damageType": "True",
   "types": [
    "Damage"
   ],
   "states": [],
   "stateValues": [],
   "value": null,
   "effectStr": "所有单位流失当前生命值5%的生命值。\n该效果不会使受影响单位的生命值低于1点",
   "table": "pl"
  },
  "denseFogSpriteAttackBoss": {
   "id": "denseFogSpriteAttackBoss",
   "name": "迷雾幽灵攻击",
   "tire": 0,
   "target": "all",
   "targetCount": 99,
   "colddown": 0,
   "mpCost": 0,
   "damageType": "True",
   "types": [
    "Damage"
   ],
   "states": [],
   "stateValues": [],
   "value": null,
   "effectStr": "所有单位流失最大生命值25%的生命值。\n该效果不会使受影响单位的生命值低于1点",
   "table": "pl"
  },
  "nianRendingClaws": {
   "id": "nianRendingClaws",
   "name": "撕裂利爪",
   "tire": 0,
   "target": "all_enemy",
   "targetCount": 999,
   "colddown": 3,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [
    "bleeding"
   ],
   "stateValues": [
    {
     "stateId": "bleeding",
     "duration": 3,
     "value": null
    }
   ],
   "value": "260+.15*targetHp",
   "effectStr": "用利爪横扫战场，对每个敌人各造成(260+其当前生命值15%)的物理伤害，并施加“流血”状态。",
   "table": "bl"
  },
  "nianWorldSwallower": {
   "id": "nianWorldSwallower",
   "name": "吞噬天地",
   "tire": 0,
   "target": "single_enemy",
   "targetCount": 1,
   "colddown": 5,
   "mpCost": 10,
   "damageType": "Physical",
   "types": [
    "Damage"
   ],
   "states": [
    "irrevocable"
   ],
   "stateValues": [
    {
     "stateId": "irrevocable",
     "duration": 99,
     "value": null
    }
   ],
   "value": null,
   "effectStr": "对一个当前生命值比例最低的敌人造成（400 + 已损失生命值95%）无视防御的伤害。\n被这个技能击杀的单位无法被复活。",
   "table": "bl"
  }
 }
};
