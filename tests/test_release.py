import pathlib,unittest,py_compile,json
R=pathlib.Path(__file__).resolve().parents[1]
class ReleaseChecks(unittest.TestCase):
 def test_python_syntax(self):
  for p in (R/'tools').glob('*.py'):py_compile.compile(str(p),doraise=True)
 def test_firmware_hash_profile(self):
  spec=json.loads((R/'theme/compatibility.json').read_text());self.assertEqual(len(spec['nativeResources']),8);self.assertEqual(len(spec['renderer']),2)
  for f in spec['nativeResources']+spec['renderer']:self.assertRegex(f['originalSha256'],r'^[a-f0-9]{64}$')
 def test_hook_size(self):self.assertEqual((R/'root/profile-hook.sh').stat().st_size,776)
 def test_no_firmware_blobs(self):
  for p in R.rglob('*'):
   if any(n in ['.private','build','.git','__pycache__'] for n in p.relative_to(R).parts):continue
   self.assertFalse(p.is_file() and (p.suffix in ['.edj','.bin','.p12','.pem','.key','.db'] or p.name.endswith('.ni.dll')),str(p))
 def test_local_links(self):
  import re
  for p in [R/'README.md']+list((R/'docs').glob('*.md')):
   for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):
    if '://' in target or target.startswith('#'):continue
    self.assertTrue((p.parent/target.split('#')[0]).exists(),str(p)+': '+target)
