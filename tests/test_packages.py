import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAMES = ['oneos-work-delivery', 'oneos-work-verify', 'oneos-work-knowledge', 'oneos-work-ux']

class Packages(unittest.TestCase):
    def test_rules_preserve_all_17_original_sections(self):
        original = (ROOT/'verification/v1.1.1/lizhen-17-original.txt').read_text().strip().split('\n\n')
        rules = (ROOT/'source/shared/references/java-backend-rules.md').read_text()
        self.assertEqual(len(original), 17)
        self.assertEqual(re.findall(r'^## (\d+)\.', rules, re.M), [str(i) for i in range(1,18)])
        for i, section in enumerate(original, 1):
            title, body = section.split('\n', 1)
            self.assertIn(f'## {i}. {title}\n\n{body}', rules)

    def test_all_packages_are_portable_and_identical_shared_content(self):
        manifests = []
        for name in NAMES:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as td:
                with zipfile.ZipFile(ROOT/'dist'/f'{name}.zip') as z:
                    self.assertIsNone(z.testzip())
                    self.assertIn('SKILL.md', z.namelist())
                    self.assertTrue(all(not p.startswith('/') and '..' not in Path(p).parts for p in z.namelist()))
                    z.extractall(td)
                p = Path(td)
                result = subprocess.run(['python3',str(p/'scripts/doctor.py')],capture_output=True,text=True)
                self.assertEqual(result.returncode,0,result.stdout+result.stderr)
                m=json.loads((p/'package-manifest.json').read_text());manifests.append(m)
                self.assertEqual(m['suite'],'oneos-work-1.1.1')
                shared={rel:h for rel,h in m['files'].items() if rel!='SKILL.md'}
                self.assertEqual(m['sharedDigest'],hashlib.sha256(json.dumps(shared,sort_keys=True,separators=(',',':')).encode()).hexdigest())
        self.assertEqual(len({m['sharedDigest'] for m in manifests}),1)

    def test_missing_and_tampered_rules_fail_integrity(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)
            with zipfile.ZipFile(ROOT/'dist/oneos-work-delivery.zip') as z:z.extractall(p)
            target=p/'references/java-backend-rules.md'
            target.write_text(target.read_text()+'\nchanged\n')
            r=subprocess.run(['python3',str(p/'scripts/doctor.py')],capture_output=True,text=True)
            self.assertNotEqual(r.returncode,0)
            self.assertIn('Changed: references/java-backend-rules.md',r.stdout)
            target.unlink()
            r=subprocess.run(['python3',str(p/'scripts/doctor.py')],capture_output=True,text=True)
            self.assertNotEqual(r.returncode,0)
            self.assertIn('Missing: references/java-backend-rules.md',r.stdout)

    def test_own_markdown_links_resolve_without_siblings(self):
        for name in NAMES:
            p=ROOT/'skills'/name
            for f in [p/'SKILL.md', *sorted((p/'references').glob('*.md'))]:
                for link in re.findall(r'\]\(([^)]+)\)',f.read_text()):
                    if '://' in link or link.startswith('#'):continue
                    target=(f.parent/link.split('#')[0]).resolve()
                    self.assertTrue(target.is_relative_to(p.resolve()),str(f)+':'+link)
                    self.assertTrue(target.exists(),str(f)+':'+link)
                    if '#' in link:
                        anchor=link.split('#',1)[1]
                        self.assertIn(f'id="{anchor}"',target.read_text(),str(f)+':'+link)

    def test_java_routing_and_ux_boundary(self):
        base=ROOT/'source/shared/references'
        self.assertIn('java-backend-rules.md',(base/'delivery.md').read_text())
        self.assertIn('java-backend-rules.md',(base/'testing.md').read_text())
        self.assertIn('纯 UI/UX',(base/'contract.md').read_text())
        self.assertNotIn('java-backend',(ROOT/'source/entries/oneos-work-ux.md').read_text())
        self.assertIn('八组',(base/'skill-regression.md').read_text())

if __name__=='__main__':unittest.main(verbosity=2)
