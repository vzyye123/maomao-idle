# 从参考站前端 bundle 提取技能静态数据 + 可执行算式，生成 backend/skill-catalog.js
#
# 数据源：pulled-frontend/_nuxt/game-battle-skill-I4Ckwbp2.js 里的多张技能表
#   yl  主表（88 个战斗技能）
#   hl  生活 / 进阶技能（11 个，对应商店里 200 猫爪印的「技能书」）
#   pl  区域 Boss 专属技能（怪物模板引用了它们，早先不在字典里只能退回普攻）
#   bl  年兽技能
#   kl  装备绑定技能（交织 / 集智 / 统御 / 瞬影）：效果依赖玩家配置的技能组合，
#       全套是「元技能」（afterEachOtherUnitAction、onOtherCast…），暂不纳入
#
# 每个技能是 {id,name,tire,target,targetCount,colddown,mpCost,effectStr,
#             damageType,skillType[],effect:async(...)}，effect 里是真实结算逻辑。
#
# 输出字段：
#   value       直接伤害/治疗/护盾的数值算式（变量已换成属性名），后端用 new Function 求值
#   stateValues 技能挂的状态及其强度（{"stateId","duration","value"}），value 是状态强度的算式
#               （参考站里叫 thisStateActuralValue，比如「诅咒降低攻击 6+等级」中的 6+等级）
#   neverCast   参考站里 preCheck 恒假 / 依赖未实装系统的技能，后端不自动施放
#
# 算式变量：自身属性（attacking/defencing/力量…）、目标属性（target*）、level（技能等级）、
# 生活等级（collecting/sewing/forging…，取自 status.otherStatus.<key>.level）。
#
# 用法：python backend/tools/gen-skill-catalog.py
import json
import re

PATH = 'pulled-frontend/_nuxt/game-battle-skill-I4Ckwbp2.js'
OUT = 'backend/skill-catalog.js'
src = open(PATH, encoding='utf-8').read()

STATS = {'attacking', 'defencing', 'strength', 'stamina', 'intelligence', 'dexterity',
         'battle', 'luck'}
# 生活等级：参考站写在 unit.status.otherStatus.<key>.level，技能算式里当普通数值用
LIFE_STATS = {'collecting', 'cooking', 'enhance', 'exploring', 'farmingAnimal', 'farmingPlant',
              'fishing', 'forging', 'knowledge', 'manufacturing', 'mining', 'mysterious',
              'sewing', 'trading'}
TARGET_STATS = {'target' + s[0].upper() + s[1:] for s in STATS}
ALLOWED = STATS | LIFE_STATS | TARGET_STATS | {
    'level', 'maxHp', 'maxMp', 'hp', 'mp', 'targetMaxHp', 'targetHp',
    'targetHpLossRatio', 'targetCount', 'Math'}

# 主表 + 附加表（第一个键用来定位表头，键名不同所以逐张写）
TABLES = [
    ('yl', 'yl={baseAttack'),
    ('hl', 'hl={beastpackRoar'),
    ('pl', 'pl={meowColossusLaser'),
    ('bl', 'bl={nianRendingClaws'),
]

# 机械提取不了的少数技能，人工补算式（数值都来自 effect 源码，见注释）
VALUE_FIXES = {
    # const o=10+dl(e,"intelligence",{...})+4*(e.skills.baseHeal.level??1)
    'baseHeal': '10+intelligence+4*(level)',
    # const d=Math.floor(.8*o+a*(.15+.005*r))，a=(c.maxHp??c.hp)-c.hp
    'starlightSanctuary': '.8*intelligence+(targetMaxHp-targetHp)*(.15+.005*level)',
    # let h=m*(2+.02*g);h+=.6*k;h*=1+.025*b  —— 连续赋值拆不出完整式子，
    # 后半段是「装备强化等级加成」，本地没有强化系统，b=0 时结果不受影响
    'enhanceStrike': '.6*intelligence+enhance*(2+.02*level)',
    # 年兽·撕裂利爪：每个敌人各吃「260 + 其当前生命 15%」（effect 里写成闭包，抓不到 Math.floor 主体）
    'nianRendingClaws': '260+.15*targetHp',
}
# target 字段和 effect 实际遍历的对象不一致的（groupCurse 写的是单目标，effect 里 for(const n of enemies)）
TARGET_FIXES = {
    'groupCurse': 'all_enemy',
    'kingAegis': 'all_ally',
    # 参考站这里写 all，effect 里对 enemies 全体结算
    'beastpackRoar': 'all_enemy',
}
# 提取到的算式其实是「有召唤物时才生效」的分支（小丑召集令回血），不能当主数值用，交给引擎处理
DROP_VALUE = {'clownSummon'}
# 不自动施放的技能：依赖的系统本地还没做，放了只会空占一回合
SKIP_CAST = {
    # 召唤系统（战斗成员在开局就固定了）
    'forgeSkillCraftTurret': 'summon',
    'forgeSkillCraftMeowColossus': 'summon',
    # 依赖喵喵巨像的充能层数（forgeSkillCraftMeowColossusState）
    'meowColossusLaser': 'summon',
    # 需要玩家预配「菜谱」（skills[id].extra.chefSkill），没配置时参考站也只会提示「忘记菜谱了」
    'chefSkill': 'extra-config',
    # 参考站自己的 effect 就是空函数
    'fishmanSkill': 'reference-noop',
}


def mb(s, i):
    """s[i] == '{'，返回配对的 '}' 下标。跳过字符串。"""
    d = 0
    q = None
    while i < len(s):
        c = s[i]
        if q:
            if c == '\\':
                i += 2
                continue
            if c == q:
                q = None
            i += 1
            continue
        if c in '"\'`':
            q = c
            i += 1
            continue
        if c == '{':
            d += 1
        elif c == '}':
            d -= 1
            if d == 0:
                return i
        i += 1
    raise ValueError


def mp(s, i):
    """s[i] == '('，返回配对的 ')' 下标。跳过字符串。"""
    d = 0
    q = None
    while i < len(s):
        c = s[i]
        if q:
            if c == '\\':
                i += 2
                continue
            if c == q:
                q = None
            i += 1
            continue
        if c in '"\'`':
            q = c
            i += 1
            continue
        if c == '(':
            d += 1
        elif c == ')':
            d -= 1
            if d == 0:
                return i
        i += 1
    raise ValueError


def cut_expr(text):
    """从 text 开头切出一个表达式：遇到深度 0 的逗号/分号/右花括号就停。"""
    d = 0
    q = None
    for i, c in enumerate(text):
        if q:
            if c == q:
                q = None
            continue
        if c in '"\'`':
            q = c
            continue
        if c in '([{':
            d += 1
            continue
        if c in ')]}':
            if d == 0:
                return text[:i]
            d -= 1
            continue
        if c in ',;' and d == 0:
            return text[:i]
    return text


def strip_dl(expr, caster='e', tgt_vars=()):
    """dl(unit,"stat",{...}) → stat（unit 是目标变量时按目标属性）。括号配对后整段替换，不能靠正则。"""
    out = expr
    while True:
        i = out.find('dl(')
        if i < 0:
            return out
        if i > 0 and (out[i - 1].isalnum() or out[i - 1] in '_$'):
            out = out[:i] + '\0' + out[i:]
            continue
        close = mp(out, i + 2)
        m = re.match(r'\s*([A-Za-z_$][\w$]*)\s*,\s*"(\w+)"', out[i + 3:close])
        if not m:
            return None
        stat = m.group(2)
        if m.group(1) != caster and m.group(1) in tgt_vars:
            stat = 'target' + stat[0].upper() + stat[1:]
        out = out[:i] + stat + out[close + 1:]


# 生活等级：unit.status.otherStatus.<key>.level（baseStatus 里那个是「战斗开局前的原始值」，
# 自然馈赠的掉落率用它，两者等价）
LIFE_PATTERNS = [
    r'[\w$]+\.baseStatus\?\.otherStatus\?\.(\w+)\?\.level\?\?[\w$?.]+\.level\?\?\s*\d+',
    r'[\w$]+\.status\?\.otherStatus\?\.(\w+)\?\.level\?\?\s*\d+',
    r'[\w$]+\.status\.otherStatus\.(\w+)\?\.level\?\?\s*\d+',
    r'[\w$]+\.status\.otherStatus\.(\w+)\.level',
    r'[\w$]+\.status\?\.otherStatus\?\.(\w+)\?\.level',
]


def sanitize(expr, binds, lvl_vars, caster='e', tgt_vars=()):
    """把参考站源码里的局部变量换成后端可求值的属性名，不可求值返回 None。"""
    expr = expr.strip()
    if not expr:
        return None
    for pattern in LIFE_PATTERNS:
        expr = re.sub(pattern,
                      lambda m: m.group(1) if m.group(1) in LIFE_STATS else m.group(0),
                      expr)
    expr = re.sub(r'[\w$]+\.skills\.[\w$]+\??\.level(?:\?\?\s*\d+)?', 'level', expr)
    # (X.maxHp??X.hp) / X.maxHp??X.hp → 目标最大生命
    expr = re.sub(r'\(([\w$]+)\.maxHp\?\?\1\.hp\)', 'targetMaxHp', expr)
    expr = re.sub(r'([\w$]+)\.maxHp\?\?\1\.hp', 'targetMaxHp', expr)
    # (X.maxHp-X.hp)/X.maxHp → 已损失生命比例
    expr = re.sub(r'\(([\w$]+)\.maxHp-\1\.hp\)/\1\.maxHp', 'targetHpLossRatio', expr)
    # (X.maxHp??X.hp)-X.hp → 已损失生命绝对值
    expr = re.sub(r'\(([\w$]+)\.maxHp\?\?\1\.hp\)-(\1)\.hp', '(targetMaxHp-targetHp)', expr)
    expr = re.sub(r'\(([\w$]+)\.hp\?\?\1\.maxHp\)-(\1)\.hp', '(targetMaxHp-targetHp)', expr)
    # 装备槽求和一类（Object.values(e.equipment)…）拿不到，交给 VALUE_FIXES
    for var, stat in sorted(binds.items(), key=lambda kv: -len(kv[0])):
        expr = re.sub(r'(?<![\w$.])' + re.escape(var) + r'(?![\w$])', stat, expr)
    for var in lvl_vars:
        expr = re.sub(r'(?<![\w$.])' + re.escape(var) + r'(?![\w$])', 'level', expr)
    expr = strip_dl(expr, caster, tgt_vars)
    if expr is None:
        return None
    if re.search(r'Math\.random|Infinity|NaN|\?\?|\|\||await|=>', expr):
        return None
    idents = set(re.findall(r'(?<![\w$.])([A-Za-z_$][\w$]*)', expr))
    bad = sorted(x for x in idents if x not in ALLOWED)
    if bad:
        return None
    return expr


def field(block, name, default=None):
    mm = re.search(r'\b' + name + r':("(?:[^"\\]|\\.)*"|[A-Za-z0-9_.]+)', block)
    if not mm:
        return default
    v = mm.group(1)
    return json.loads(v) if v.startswith('"') else v


def parse_table(table_name, marker):
    """解析一张技能表，返回 {skillId: entry}。"""
    start = src.index(marker)
    brace = src.index('{', start)
    body = src[brace + 1:mb(src, brace)]
    out = {}
    cursor = 0
    for m in re.finditer(r'([A-Za-z_][A-Za-z0-9_]*):\{', body):
        if m.start() < cursor:
            continue
        bs = body.index('{', m.start())
        be = mb(body, bs)
        block = body[bs:be + 1]
        cursor = be + 1

        # 施放者 / 目标变量：参考站 effect 的入参是 {self:施放者, enemies:..., allies:...}，
        # 施放者变量从 `self:X` 里取；目标变量是遍历敌人列表 / At()/oe()/Ht() 选出来的那个。
        # 只有这几个变量上的 dl() 才算「目标属性」，其余一律当自身属性（早期就是这么处理的，
        # 全量 56 个技能已验证过；把 ironWall 的耐力错认成目标耐力就是这个坑）。
        cm = (re.search(r'effect:\s*async\s*\(\s*\{\s*self\s*:\s*([\w$]+)', block)
              or re.search(r'effect:\s*async\s*\w*\s*=>\s*\{\s*(?:const|let)\s*\{\s*self\s*:\s*([\w$]+)', block))
        caster = cm.group(1) if cm else 'e'
        tgt_vars = set(re.findall(r'for\s*\(\s*(?:const|let)\s+([\w$]+)\s+of', block))
        tgt_vars |= set(re.findall(r'(?:const |let )?([\w$]+)\s*=\s*(?:At|oe|Ht)\s*\(', block))
        # thisSkill 是「本次施放的技能对象」，它上面的 level 就是技能等级
        tsm = re.search(r'thisSkill\s*:\s*([\w$]+)', block)
        this_var = tsm.group(1) if tsm else None

        # 局部变量 → 属性名（参考站写法：const r=dl(e,"intelligence",{...})）
        binds = {}
        for bm in re.finditer(r'([A-Za-z_$][\w$]*)=dl\(\s*([A-Za-z_$][\w$]*)\s*,\s*"(\w+)"', block):
            stat = bm.group(3)
            if stat not in STATS and stat not in LIFE_STATS:
                continue
            if bm.group(2) != caster and bm.group(2) in tgt_vars:
                stat = 'target' + stat[0].upper() + stat[1:]
            binds.setdefault(bm.group(1), stat)
        for tm in re.finditer(r'([A-Za-z_$][\w$]*)=(\w+)\.maxHp', block):
            binds.setdefault(tm.group(1), 'targetMaxHp')
        for tm in re.finditer(r'([A-Za-z_$][\w$]*)=(\w+)\.hp\b', block):
            binds.setdefault(tm.group(1), 'targetHp')
        # 生活等级也常写成局部变量（const s=e.status.otherStatus?.farmingAnimal?.level??1）
        for lm in re.finditer(r'([A-Za-z_$][\w$]*)=[\w$?.]+otherStatus\??\.(\w+)\??\.level\?\?\s*\d+', block):
            if lm.group(2) in LIFE_STATS:
                binds.setdefault(lm.group(1), lm.group(2))
        lvl_vars = {lm.group(1) for lm in re.finditer(
            r'([A-Za-z_$][\w$]*)=\w+\.skills\.[\w$]+(?:\?\.)?\.?level\?\?\s*\d+', block)}
        if this_var:
            lvl_vars |= {lm.group(1) for lm in re.finditer(
                r'([A-Za-z_$][\w$]*)=' + re.escape(this_var) + r'\?\.level\?\?\s*\d+', block)}

        # 局部别名（let s=6+(level) 之后 thisStateActuralValue:s 这类），最多展开 3 层
        alias = {}
        for am in re.finditer(r'(?:const |let |var )([A-Za-z_$][\w$]*)=', block):
            name = am.group(1)
            if name in binds or name in lvl_vars:
                continue
            rhs = cut_expr(block[am.end():])
            if rhs.strip():
                alias.setdefault(name, rhs.strip())

        def expand(expr):
            out_expr = expr
            for _ in range(3):
                changed = False
                for name, rhs in sorted(alias.items(), key=lambda kv: -len(kv[0])):
                    pattern = r'(?<![\w$.])' + re.escape(name) + r'(?![\w$])'
                    if re.search(pattern, out_expr):
                        out_expr = re.sub(pattern, '(' + rhs + ')', out_expr)
                        changed = True
                if not changed:
                    break
            return out_expr

        def usable(expr):
            if not expr:
                return None
            return sanitize(expand(expr), binds, lvl_vars, caster, tgt_vars)

        # ---- 数值算式：先找 Math.floor(...)（参考站的直接伤害/治疗都包了这一层）
        candidates = []
        for f in re.findall(r'Math\.floor\(((?:[^()]|\([^()]*\)|\((?:[^()]|\([^()]*\))*\))*)\)', block):
            candidates.append(f)
        # 再找 +(...).toFixed(0)（群体治疗这类四舍五入写法）
        for f in re.findall(r'\+\(((?:[^()]|\([^()]*\))*)\)\.toFixed\(0\)', block):
            candidates.append(f)
        sid = field(block, 'id', m.group(1))
        value = None
        for f in candidates:
            expr = usable(f)
            if expr:
                value = expr
                break
        if sid in VALUE_FIXES:
            value = VALUE_FIXES[sid]
        if sid in DROP_VALUE:
            value = None

        # ---- 状态及其强度：ol("<stateId>",<持续回合>,...) 里带 thisStateActuralValue 的
        state_values = []
        seen_states = set()
        for sm in re.finditer(r'ol\("([\w]+)",\s*(\d+),', block):
            state_id, dur = sm.group(1), int(sm.group(2))
            if state_id in seen_states:
                continue
            seen_states.add(state_id)
            open_idx = block.index('(', sm.start())
            call = block[open_idx:mp(block, open_idx) + 1]
            vm = re.search(r'thisStateActuralValue:\s*', call)
            state_value = None
            if vm:
                state_value = usable(cut_expr(call[vm.end():]))
            state_values.append({'stateId': state_id, 'duration': dur, 'value': state_value})

        dmg = re.search(r'damageType:(T\.\w+)', block)
        types = re.search(r'skillType:\[([^\]]*)\]', block)
        # 参考站里 preCheck:...=>!1 表示「这个技能永远不放」（例如偷天换日），后端也跟着不放
        never_cast = bool(re.search(r'preCheck:\s*\([^)]*\)\s*=>\s*!1\b', block))
        dmg_type = dmg.group(1).replace('T.', '') if dmg else 'NoDamage'
        type_list = [t.strip().replace('D.', '') for t in types.group(1).split(',')] if types else []

        entry = {
            'id': sid,
            'name': field(block, 'name', sid),
            'tire': int(field(block, 'tire') or 0),
            'target': TARGET_FIXES.get(sid) or (field(block, 'target') or 'self').strip('"'),
            'targetCount': int(field(block, 'targetCount') or 1),
            'colddown': int(field(block, 'colddown') or 0),
            'mpCost': int(field(block, 'mpCost') or 0),
            'damageType': dmg_type,
            'types': type_list,
            'states': sorted(seen_states),
            'stateValues': state_values,
            'value': value,
            'effectStr': field(block, 'effectStr', ''),
            'table': table_name,
        }
        if never_cast or sid in SKIP_CAST:
            entry['neverCast'] = True
        out.setdefault(sid, entry)
    return out


skills = {}
for table_name, marker in TABLES:
    for sid, entry in parse_table(table_name, marker).items():
        # yl 优先：同一 id 出现在多张表时以主表为准
        skills.setdefault(sid, entry)

# 经验门槛表：前端 pq（等级 1..151，pq[level] 是升到下一级所需经验）
base = [0, 20, 45, 80, 125, 180, 245, 320, 405, 500, 605, 720, 845, 980, 1125, 1280, 1445,
        1620, 1805, 2000, 2205, 2420, 2645, 2880, 3125, 3380, 3645, 3920, 4205, 4500, 4805,
        5760, 6825, 8000, 9285, 10680, 12185, 13800, 15525, 17360, 19305, 21360, 23525, 25800,
        28185, 30680, 33285, 36000, 38825, 41760, 44805]
exp = list(base)
exp += [int(44805 * (1.18 ** (t + 1))) for t in range(50)]
exp += [int(44805 * (1.18 ** 50) * (1.15 ** (t + 1))) for t in range(30)]
exp += [int(44805 * (1.18 ** 50) * (1.15 ** 30) * (1.12 ** (t + 1))) for t in range(20)]

with open(OUT, 'w', encoding='utf-8') as fh:
    fh.write('// 自动生成，勿手改：python backend/tools/gen-skill-catalog.py\n')
    fh.write('// 数据来源：pulled-frontend/_nuxt/game-battle-skill-I4Ckwbp2.js 的 yl/hl/pl/bl 四张技能表\n')
    fh.write('// value：直接伤害/治疗/护盾的算式（变量已换成属性名），后端用 new Function 求值。\n')
    fh.write('// stateValues：技能挂的状态及强度算式（参考站的 thisStateActuralValue）。\n')
    fh.write('// neverCast：参考站里 preCheck 恒假、或依赖未实装系统（召唤/菜谱）的技能。\n')
    fh.write('export default ' + json.dumps({'expTable': exp, 'skills': skills},
                                            ensure_ascii=False, indent=1) + ';\n')

usable = [s for s in skills.values() if s['value']]
with_state = [s for s in skills.values() if s['stateValues']]
print('技能', len(skills), '| 有直接算式', len(usable),
      '| 有状态', len(with_state),
      '| 两者都没有', sorted(s['id'] for s in skills.values() if not s['value'] and not s['stateValues']))
print('neverCast', sorted(s['id'] for s in skills.values() if s.get('neverCast')))
for tname, _ in TABLES:
    print('表', tname, '贡献', len([s for s in skills.values() if s['table'] == tname]))
print('经验表长度', len(exp), '| 前 5', exp[:5])
