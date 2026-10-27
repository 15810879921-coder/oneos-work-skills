#!/usr/bin/env python3
"""Validate this imported skill's immutable package files, not project readiness."""
import hashlib
import json
from pathlib import Path
import sys

def main():
    root=Path(__file__).resolve().parents[1]
    manifest=root/'package-manifest.json'
    if not manifest.is_file():
        print(json.dumps({'packageValid':False,'errors':['package-manifest.json missing; import complete skill folder']}));return 1
    obj=json.loads(manifest.read_text()); errors=[]
    for rel,expected in obj['files'].items():
        path=root/rel
        if not path.resolve().is_relative_to(root.resolve()):
            errors.append('Unsafe manifest path');continue
        if not path.is_file(): errors.append('Missing: '+rel)
        elif hashlib.sha256(path.read_bytes()).hexdigest()!=expected:
            errors.append('Changed: '+rel)
    print(json.dumps({'packageValid':not errors,'packageId':obj['packageId'],'sharedDigest':obj['sharedDigest'],'filesChecked':len(obj['files']),'errors':errors,'projectConfigured':False,'knowledgeAccessVerified':False,'modelVerified':False,'notice':'Package integrity only. It does not prove remote permissions, test environment, model connectivity, or business acceptance.'},ensure_ascii=False,indent=2))
    return bool(errors)

if __name__=='__main__':sys.exit(main())
