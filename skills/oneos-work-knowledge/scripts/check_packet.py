#!/usr/bin/env python3
"""Check declared handoff fields only; never verifies remote evidence or advances state."""
import argparse
import json
import sys

def check(x, stage):
    errors=[]
    def require(key):
        if not x.get(key): errors.append('Missing '+key)
    require('scope')
    if not isinstance(x.get('scope'),list) or any(not isinstance(a,str) or not a for a in x.get('scope',[])):
        errors.append('scope must be a nonempty list of acceptance IDs')
    if stage=='branch':
        for k in ['targetBranch','commits','mergeEvidence','checks','handoff','dependencies']: require(k)
        if x.get('mergeTriggersDeployment') is not False: errors.append('mergeTriggersDeployment must be false')
        if any(v.get('result')!='passed' or not v.get('evidence') for v in x.get('checks',[])):
            errors.append('All required checks need passed results and evidence')
    elif stage=='intake':
        for k in ['environment','expectedComponents','deployedComponents','deploymentEvidence']: require(k)
        expected=x.get('expectedComponents',{})
        actual=x.get('deployedComponents',{})
        if not isinstance(expected,dict) or not isinstance(actual,dict) or any(not v or actual.get(k)!=v for k,v in expected.items()):
            errors.append('Deployed components do not match expected components')
        if x.get('accountsReady') is not True or x.get('dataReady') is not True:
            errors.append('Test roles and data must be ready')
        if x.get('environment','').lower() in ['production','prod']: errors.append('Production is outside this package')
    elif stage=='result':
        for k in ['environment','deploymentId','results']: require(k)
        if 'openBlockingDefects' not in x or not isinstance(x['openBlockingDefects'],list) or x['openBlockingDefects']:
            errors.append('Blocking defects must be explicitly empty')
        rows=x.get('results',[])
        for ac in x.get('scope',[]):
            current=[r for r in rows if r.get('ac')==ac and r.get('deploymentId')==x.get('deploymentId')]
            if not current or any(r.get('result')!='passed' or not r.get('evidence') for r in current):
                errors.append('Acceptance lacks current passed evidence: '+ac)
    else: errors.append('Unknown stage')
    return errors

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('stage',choices=['branch','intake','result']);p.add_argument('packet')
    a=p.parse_args()
    try:
        with open(a.packet,encoding='utf-8') as f: x=json.load(f)
        errors=check(x,a.stage)
    except (OSError,ValueError,TypeError,AttributeError) as e: errors=['Invalid packet: '+str(e)]
    print(json.dumps({'declaredFieldsValid':not errors,'errors':errors,'remoteEvidenceVerified':False,'stateChanged':False,'notice':'A valid structure is not actual merge, deployment, test pass, independent QA, or permission.'},ensure_ascii=False,indent=2))
    return bool(errors)

if __name__=='__main__':sys.exit(main())
