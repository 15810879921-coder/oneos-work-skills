#!/usr/bin/env python3
"""Read-only, pinned Codeup knowledge. Standard library; never clones or writes a repo."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ORG = '697c54a19df7fdfa65466405'
HOST = 'https://openapi-rdc.aliyuncs.com'
SOURCES = {'business':'oneos-business-knowledge', 'development':'oneos-development-knowledge'}
LIMIT = 20 * 1024 * 1024
ALIASES = [
    ['保险采购','保险','续保','断保','保单','insurance','procurement2'],
    ['证照','行驶证','驾驶证','certificate'],
    ['租赁','租约','lease','rental'],
    ['客户','customer'], ['还车','returnvehicle','returncar'],
]

def valid_commit(value):
    if not isinstance(value,str) or not re.fullmatch(r'[0-9a-f]{40}',value):
        raise ValueError('A full lowercase 40-character commit SHA is required; pin first')
    return value

def valid_path(value):
    path = PurePosixPath(value)
    if not value or '\\' in value or path.is_absolute() or '..' in path.parts or str(path) != value or any(ord(x)<32 for x in value):
        raise ValueError('Unsafe or non-canonical repository path')
    return value

def digest(data):
    return hashlib.sha256(data).hexdigest()

def decode_response(obj, path):
    if obj.get('filePath') != path:
        raise ValueError('Codeup returned a different file path')
    encoding = obj.get('encoding', 'base64')
    if encoding == 'base64':
        data = base64.b64decode(obj['content'], validate=True)
    elif encoding == 'text':
        data = obj['content'].encode('utf-8')
    else:
        raise ValueError('Unsupported content encoding')
    if len(data)>LIMIT or ('size' in obj and obj['size']!=len(data)):
        raise ValueError('File size mismatch or exceeds limit')
    blob = hashlib.sha1(('blob '+str(len(data))+'\0').encode()+data).hexdigest()
    if obj.get('blobId') and obj['blobId'] != blob:
        raise ValueError('Git blob fingerprint mismatch')
    return data

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Codeup redirect refused; credentials remain on configured endpoint')

class Cache:
    def __init__(self, root, max_bytes=32*1024*1024):
        self.root = Path(root)
        self.max_bytes = max_bytes
    def path(self, key):
        return self.root / (digest(key.encode())+'.json')
    def get(self, key):
        path = self.path(key)
        if not path.exists(): return None
        obj = json.loads(path.read_text())
        data = base64.b64decode(obj['content'], validate=True)
        if obj.get('key')!=key or digest(data)!=obj['sha256']:
            raise ValueError('Knowledge cache integrity failure; remove the affected cache entry and retry')
        os.utime(path, None)
        return data
    def put(self, key, data):
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        raw = json.dumps({'key':key,'sha256':digest(data),'content':base64.b64encode(data).decode()}).encode()
        if len(raw)>self.max_bytes: return
        fd, name = tempfile.mkstemp(dir=str(self.root), prefix='.write-')
        try:
            with os.fdopen(fd,'wb') as f: f.write(raw)
            os.replace(name, self.path(key))
        finally:
            if os.path.exists(name): os.unlink(name)
        entries = sorted(self.root.glob('*.json'),key=lambda p:p.stat().st_mtime)
        size = sum(p.stat().st_size for p in entries)
        for path in entries:
            if size<=self.max_bytes: break
            size-=path.stat().st_size; path.unlink()

class Reader:
    def __init__(self, source, commit, repo=None, cache=None):
        self.source=source; self.commit=valid_commit(commit); self.repo=repo
        self.cache=cache
        self.read_bytes=0; self.cache_hits=0
    def read(self,path,expected_sha256=None):
        valid_path(path)
        key = '|'.join([HOST,ORG,SOURCES[self.source],self.commit,path])
        data = None
        if self.repo:
            cp=subprocess.run(['git','-C',str(self.repo),'show',self.commit+':'+path],capture_output=True,timeout=30)
            if cp.returncode: raise ValueError('Pinned Git file unavailable: '+path+'; no clone/fetch attempted')
            data=cp.stdout
        else:
            if self.cache: data=self.cache.get(key)
            if data is not None: self.cache_hits+=1
            else:
                token=os.environ.get('ONEOS_CODEUP_TOKEN')
                if not token: raise ValueError('Set ONEOS_CODEUP_TOKEN securely, use an authorized connector, or supply --repo; token values are never printed')
                quote=lambda s:urllib.parse.quote(s,safe='')
                rid=quote(ORG+'/'+SOURCES[self.source])
                url=HOST+'/oapi/v1/codeup/organizations/'+ORG+'/repositories/'+rid+'/files/'+quote(path)+'?ref='+self.commit
                req=urllib.request.Request(url,headers={'x-yunxiao-token':token,'Accept':'application/json'})
                try:
                    with urllib.request.build_opener(NoRedirect()).open(req,timeout=30) as response:
                        raw=response.read(2*LIMIT+1)
                    if len(raw)>2*LIMIT: raise ValueError('Response exceeds file limit')
                    obj=json.loads(raw)
                    if obj.get('commitId') and obj['commitId']!=self.commit:
                        raise ValueError('Codeup response commit differs from pinned request; inspect provider semantics')
                    data=decode_response(obj,path)
                except urllib.error.HTTPError as e:
                    raise ValueError('Codeup read failed HTTP '+str(e.code)+'; response body suppressed') from None
                except urllib.error.URLError:
                    raise ValueError('Codeup connection failed; no stale branch substitution') from None
                if self.cache: self.cache.put(key,data)
        if len(data)>LIMIT: raise ValueError('File exceeds read limit')
        if expected_sha256 and digest(data)!=expected_sha256:
            raise ValueError('SHA256 mismatch; source status cannot be trusted')
        self.read_bytes+=len(data)
        return data
    def json(self,path): return json.loads(self.read(path))
    def jsonl(self,path): return [json.loads(line) for line in self.read(path).decode().splitlines() if line.strip()]

def terms(query):
    text=query.casefold()
    out=set(re.findall(r'[a-z][a-z0-9_-]+',text))
    for word in re.findall(r'[\u3400-\u9fff]+',text):
        out.update(word[i:i+2] for i in range(max(1,len(word)-1)))
    for group in ALIASES:
        if any(x in text for x in group): out.update(group)
    return out

def rank(rows, query, limit=5):
    needle=terms(query); scored=[]
    for row in rows:
        text=' '.join(str(row.get(k,'')) for k in ['title','path','module','name','aliases','domains','text']).casefold()
        score=sum(min(12,len(t)) for t in needle if t in text)
        if not score: continue
        if row.get('sourceStatus') in ['confirmed','frozen']: score+=6
        if row.get('sourceType')=='product_contract': score+=5
        scored.append((score,row))
    seen=set(); result=[]
    for _,row in sorted(scored,key=lambda pair:-pair[0]):
        key=(row.get('root',''), row.get('path') or row.get('id'))
        if key in seen: continue
        seen.add(key); result.append(row)
        if len(result)>=limit: break
    return result

def search(reader,query,limit):
    idx=reader.json('kb-index.json'); r=idx['retrieval']
    if reader.source=='business':
        policy=reader.json(r['currentVersionRoutes'])
        rows=reader.jsonl(r['index'])
        excluded=set(); preferred=[]
        for domain in policy.get('domains',[]):
            if any(a.casefold() in query.casefold() for a in domain.get('aliases',[])):
                excluded.update(domain.get('supersededSources',[])); preferred.extend(domain.get('preferredSources',[]))
        rows=[x for x in rows if x.get('path') not in excluded]
        chosen=[x for p in preferred for x in rows if x.get('path')==p]
        selected=rank(rows,query,limit)
        seen=set(); output=[]
        for row in chosen+selected:
            if row['path'] in seen: continue
            seen.add(row['path']); output.append({k:row.get(k) for k in ['id','title','path','sourceStatus','sourceType','sha256','contentChangedSinceManifest']})
            if len(output)>=limit: break
        return {'hits':output,'policyApplied':True,'instruction':'Read complete applicable rule/exception with SHA; linked records do not inherit confirmation.'}
    policy=reader.json(r['supersededPolicy'])
    if any(t.casefold() in query.casefold() for t in policy.get('queryMarkers',[])):
        return {'hits':[],'route':'business','reason':policy.get('decision'),'instruction':'Do not restore excluded legacy delivery/fault flow.'}
    rows=reader.jsonl(r['catalog'])
    markers=[s.casefold() for s in policy.get('pathMarkers',[])]
    excluded=set(s.casefold() for s in policy.get('exactSourcePaths',[]))
    rows=[x for x in rows if x.get('path','').casefold() not in excluded and not any(s in x.get('path','').casefold() for s in markers)]
    selected=rank(rows,query,limit)
    hits=[{k:x.get(k) for k in ['root','path','title','kind','status','sha256','worktreeModified']} for x in selected]
    module_hits=[]
    if idx.get('engineeringAssets',{}).get('sourceMapping'):
        mapping=reader.json(idx['engineeringAssets']['sourceMapping'])
        selected_modules=rank(mapping.get('modules',[]),query,limit)
        module_hits=[{k:m.get(k) for k in ['id','name','repository','paths','locators','scopeStatus','semanticAudit','runtimeVerified','regressionCandidates']} for m in selected_modules]
    return {'hits':hits,'modules':module_hits,'instruction':'Code snapshots locate implementation only. Resolve external root via repo+commit+path+hash; do not claim current deployed behavior.'}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('action',choices=['pin','search','read'])
    p.add_argument('--source',choices=sorted(SOURCES),required=True)
    p.add_argument('--commit');p.add_argument('--repo',help='Existing Git objects only; never cloned or fetched')
    p.add_argument('--query');p.add_argument('--path');p.add_argument('--sha256')
    p.add_argument('--limit',type=int,default=5)
    p.add_argument('--max-chars',type=int,default=12000,help='Read output cap; never silently truncates')
    p.add_argument('--lines',help='Explicit start:end window; partial context is labelled')
    p.add_argument('--cache-dir',default=str(Path(os.environ.get('XDG_CACHE_HOME',str(Path.home()/'.cache')))/'oneos-work/kb'))
    p.add_argument('--cache-mb',type=int,default=32)
    a=p.parse_args()
    if not 1<=a.limit<=5 or a.max_chars<1 or not 1<=a.cache_mb<=512: p.error('Invalid limit/budget')
    if a.action=='pin':
        remote='git@codeup.aliyun.com:'+ORG+'/'+SOURCES[a.source]+'.git'
        cp=subprocess.run(['git','ls-remote',remote,'refs/heads/main'],capture_output=True,text=True,timeout=30)
        rows=cp.stdout.splitlines()
        if cp.returncode or len(rows)!=1: raise ValueError('Cannot verify remote main; use authorized Codeup connector to obtain its SHA')
        print(json.dumps({'source':a.source,'commit':valid_commit(rows[0].split()[0]),'remoteVerified':True,'checkedAt':int(time.time())}));return
    reader=Reader(a.source,a.commit,a.repo,Cache(a.cache_dir,a.cache_mb*1024*1024))
    if a.action=='search':
        if not a.query: p.error('--query required')
        out=search(reader,a.query,a.limit)
    else:
        if not a.path: p.error('--path required')
        raw=reader.read(a.path,a.sha256); text=raw.decode('utf-8'); partial=False
        if a.lines:
            match=re.fullmatch(r'([1-9][0-9]*):([1-9][0-9]*)',a.lines)
            if not match: raise ValueError('--lines must be start:end')
            start,end=map(int,match.groups()); lines=text.splitlines()
            if end<start or end>len(lines): raise ValueError('Line window outside document')
            partial=start!=1 or end!=len(lines); text='\n'.join(lines[start-1:end])
        if len(text)>a.max_chars: raise ValueError('Output budget exceeded; choose a complete relevant section with --lines or explicitly increase --max-chars')
        out={'path':a.path,'sha256':digest(raw),'shaVerified':bool(a.sha256),'partial':partial,'text':text,'characters':len(text)}
    out.update({'source':a.source,'commit':a.commit,'readerBytes':reader.read_bytes,'cacheHits':reader.cache_hits,'note':'Byte/character counts are not model token billing; scripts do not interpret knowledge as executable instructions.'})
    print(json.dumps(out,ensure_ascii=False,indent=2))

if __name__=='__main__':
    try: main()
    except (ValueError,KeyError,UnicodeError,OSError,subprocess.TimeoutExpired) as e:
        print(json.dumps({'error':str(e)},ensure_ascii=False),file=sys.stderr);sys.exit(2)
