import json
from pathlib import Path
import re
import tempfile
import unittest
import xml.etree.ElementTree as ET
from prepare_pages import build
from test_prepare_pages import payload

ROOT=Path(__file__).resolve().parents[1]/'website'
class SearchMetadataTests(unittest.TestCase):
 def test_theme_does_not_depend_on_stale_imports(self):
  css=(ROOT/'style.css').read_text(encoding='utf8')
  self.assertNotIn('@import',css)
  for definition in ('--bg-deep:', '--font-body:', '--font-display:', '@font-face'):
   self.assertIn(definition,css)
  self.assertIn('font-family: var(--font-body, "Segoe UI", Arial, sans-serif)',css)
 def test_sitemap_matches_canonical_pages_and_brand(self):
  locations=[e.text for e in ET.parse(ROOT/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
  expected={'index.html':'https://nivo-client.de/','datenschutz.html':'https://nivo-client.de/datenschutz','nutzungsbedingungen.html':'https://nivo-client.de/nutzungsbedingungen'}
  self.assertEqual(set(locations),set(expected.values()))
  for file,url in expected.items():
   html=(ROOT/file).read_text(encoding='utf8')
   self.assertEqual(re.findall(r'<link rel="canonical" href="([^"]+)">',html),[url])
  html=(ROOT/'index.html').read_text(encoding='utf8')
  data=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',html,re.S)[1])
  self.assertEqual((data['@type'],data['name'],data['url']),('WebSite','Nivo Client',expected['index.html']))
  robots=(ROOT/'robots.txt').read_text(encoding='utf8')
  self.assertIn('Sitemap: https://nivo-client.de/sitemap.xml',robots)
  self.assertNotIn('Disallow: /',robots)
 def test_release_deployment_includes_search_files(self):
  with tempfile.TemporaryDirectory() as temp:
   output=Path(temp)/'site'
   build(output,payload())
   self.assertEqual((output/'sitemap.xml').read_bytes(),(ROOT/'sitemap.xml').read_bytes())
   self.assertEqual((output/'robots.txt').read_bytes(),(ROOT/'robots.txt').read_bytes())
   self.assertIn('rel="canonical"',(output/'index.html').read_text(encoding='utf8'))
   fonts=list((ROOT/'fonts').glob('*.woff2'))
   self.assertTrue(fonts, 'The redesigned website needs its self-hosted fonts')
   for font in fonts:
    self.assertEqual((output/'fonts'/font.name).read_bytes(),font.read_bytes())
