"""Read-only TV-free dashboard export. Home edits affect in-memory preview data only."""
import http.server,json,pathlib,urllib.parse,hashlib
R=pathlib.Path(__file__).resolve().parents[1]/'docs/dashboard-preview';F=json.loads((R/'fixtures.json').read_text())
class Handler(http.server.BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def send(self,data,typ='application/json',status=200):
  b=data if isinstance(data,bytes) else json.dumps(data,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type',typ);self.end_headers();self.wfile.write(b)
 def do_GET(self):
  u=urllib.parse.urlparse(self.path);p=u.path
  if p in ['/','/index.html']:return self.send((R/'index.html').read_bytes(),'text/html; charset=utf-8')
  if p=='/icon.png':return self.send((R/'icon.png').read_bytes(),'image/png')
  if p=='/home-panel/icon':
   aid=urllib.parse.parse_qs(u.query).get('appId',[''])[0];a=next((a for a in F['/home-panel']['available'] if a['appId']==aid),None);f=R/('icon-'+a['slug']+'.png') if a else R/'missing'
   return self.send(f.read_bytes(),'image/png') if f.exists() else self.send({},status=404)
  if p=='/dock/icon':
   slug=urllib.parse.parse_qs(u.query).get('slug',[''])[0];entry=next((a for a in F['/home-panel']['entries'] if a['slug']==slug),None);a=next((a for a in F['/home-panel']['available'] if entry and a['appId']==entry['appId']),None);f=R/('icon-'+a['slug']+'.png') if a else R/'missing';return self.send(f.read_bytes(),'image/png') if f.exists() else self.send({},status=404)
  return self.send(F.get(p,{}))
 def do_POST(self):
  p=urllib.parse.urlparse(self.path).path;d=json.loads(self.rfile.read(int(self.headers.get('Content-Length',0))) or '{}')
  if p=='/home-panel':
   x=F[p];available={a['appId']:a for a in x['available']};ids=d.get('appIds',[])
   if d.get('revision')!=x['revision'] or not ids or len(set(ids))!=len(ids) or any(i not in available for i in ids):return self.send({'error':'Invalid layout'},status=409)
   x['entries']=[available[i] for i in ids]+x['entries'][-2:];x['revision']=hashlib.sha256(json.dumps(ids).encode()).hexdigest();return self.send(x)
  return self.send({'error':'Read-only documentation preview'},status=405)
http.server.HTTPServer(('127.0.0.1',8768),Handler).serve_forever()
