"""Build four portable local packages from one shared source. No network or install."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSION = '1.1.1'
NAMES = ['oneos-work-delivery', 'oneos-work-verify', 'oneos-work-knowledge', 'oneos-work-ux']

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def build():
    shared = ROOT/'source/shared'
    hashes = {p.relative_to(shared).as_posix(): digest(p) for p in sorted(shared.rglob('*')) if p.is_file() and '__pycache__' not in p.parts}
    shared_digest = hashlib.sha256(json.dumps(hashes, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    (ROOT/'dist').mkdir(exist_ok=True)
    for name in NAMES:
        target = ROOT/'skills'/name
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(shared, target, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
        shutil.copy2(ROOT/'source/entries'/f'{name}.md', target/'SKILL.md')
        files = dict(hashes, **{'SKILL.md': digest(target/'SKILL.md')})
        manifest = {'packageId':f'{name}@{VERSION}', 'suite':f'oneos-work-{VERSION}', 'sharedDigest':shared_digest, 'files':dict(sorted(files.items()))}
        (target/'package-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
        with zipfile.ZipFile(ROOT/'dist'/f'{name}.zip', 'w', zipfile.ZIP_DEFLATED) as z:
            for p in sorted(target.rglob('*')):
                if p.is_file():
                    info = zipfile.ZipInfo(p.relative_to(target).as_posix(), date_time=(2026,10,28,0,0,0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    info.external_attr = 0o100644 << 16
                    z.writestr(info,p.read_bytes())
    print(json.dumps({'version':VERSION,'packages':NAMES,'sharedDigest':shared_digest},ensure_ascii=False))

if __name__ == '__main__':
    build()
