import re, json
lines=open('scripts/input/wafct2019.txt',encoding='utf8').read().split('\n')
NUM=re.compile(r'^\[?-?\d[\d.]*\]?(\(\[?\d[\d.]*\]?\))?$')
foods={}
cols=None; block=None
code_re=re.compile(r'^\s+(\d\d_\d{3})\s{2,}(.*)$')
for i,l in enumerate(lines):
    if l.startswith('\f'): cols=None
    if 'INFOODS TAGNAMES' in l:
        cols=[]
        for m in re.finditer(r'\S+',l):
            if m.group() in ('INFOODS','TAGNAMES'): continue
            cols.append((m.group(), (m.start()+m.end())/2, m.start()))
        block=cols[0][0]
        continue
    if not cols: continue
    m=code_re.match(l)
    if not m: continue
    code=m.group(1)
    first_start=cols[0][2]-8
    # tokens split on 2+ spaces
    toks=[(mm.group(), mm.start(), mm.end()) for mm in re.finditer(r'\S+(?: \S+)*',l)]
    vals={}
    name_parts=[]
    for t,s,e in toks:
        if t==code: continue
        tt=t.replace(' ','')
        if s>=first_start and (NUM.match(tt) or tt=='tr'):
            c=(s+e)/2
            tag=min(cols,key=lambda x:abs(x[1]-c))[0]
            vals[tag]=tt
        elif s<first_start:
            name_parts.append(t)
    f=foods.setdefault(code,{'code':code,'raw':{}})
    f['raw'].update(vals)
    if block.startswith('CA') :
        nm=' '.join(name_parts).strip()
        if not nm:
            # multiline name: look at neighbouring lines
            above=lines[i-1].strip(); below=lines[i+1].strip() if i+1<len(lines) else ''
            j=i+1
            while j<len(lines) and (not lines[j].strip() or re.match(r'^\d+$',lines[j].strip()) or lines[j].startswith('\f')): j+=1
            nm=(above+' '+lines[j].strip()).strip()
        f['name']=nm
json.dump(foods,open('scripts/wafct2019_raw.json','w'),indent=1,ensure_ascii=False)
print(len(foods))
for c in ['04_078','09_057','02_040','07_083','04_080','01_038']:
    print(c, foods.get(c))
