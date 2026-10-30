#!/usr/bin/env python3
"""Explicit-target client. Tokens are read from a private file and never printed."""
import argparse,base64,hashlib,json,os,pathlib,shlex,urllib.request
class TV:
 def __init__(self,ip=None,token_file=None):
  import ipaddress
  self.ip=str(ipaddress.ip_address(ip or os.environ['TV_IP']));self.base='http://'+self.ip+':8099';p=pathlib.Path(token_file or os.environ.get('VETRO_TOKEN_FILE','.private/admin-token'));self.token=p.read_text().strip()
 def request(self,path,data=None,timeout=45):
  h={'X-Vetro-Exec-Token':self.token};b=None
  if data is not None:h['Content-Type']='application/json';b=json.dumps(data).encode()
  with urllib.request.urlopen(urllib.request.Request(self.base+path,data=b,headers=h),timeout=timeout) as r:return json.load(r)
 def shell(self,cmd,timeout=45):
  r=self.request('/exec',{'cmd':cmd},timeout)
  if not r.get('ok'):raise RuntimeError(r.get('stderr') or r.get('output') or 'TV command failed')
  return r['output']
 def node(self,code):return self.shell('/usr/bin/node -e '+shlex.quote('eval(new Buffer('+json.dumps(base64.b64encode(code.encode()).decode())+',"base64").toString())'))
 def read(self,p):return base64.b64decode(self.node('console.log(require("fs").readFileSync('+json.dumps(p)+').toString("base64"))').strip())
 def put(self,data,p,mode=0o600):
  self.node('require("fs").writeFileSync('+json.dumps(p)+',"",{mode:384})')
  for i in range(0,len(data),24576):self.node('require("fs").appendFileSync('+json.dumps(p)+',new Buffer('+json.dumps(base64.b64encode(data[i:i+24576]).decode())+',"base64"))')
  self.node('var f=require("fs"),p='+json.dumps(p)+';f.chmodSync(p,'+str(mode)+');if(require("crypto").createHash("sha256").update(f.readFileSync(p)).digest("hex")!=='+json.dumps(hashlib.sha256(data).hexdigest())+')throw Error("Transfer checksum mismatch")')
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--tv');p.add_argument('--token-file');s=p.add_subparsers(dest='action',required=True)
 q=s.add_parser('get');q.add_argument('route');q=s.add_parser('exec');q.add_argument('--file',type=pathlib.Path,required=True);q=s.add_parser('node');q.add_argument('--file',type=pathlib.Path,required=True);q=s.add_parser('put');q.add_argument('file',type=pathlib.Path);q.add_argument('remote');q.add_argument('--mode',type=lambda s:int(s,8),default=0o600)
 a=p.parse_args();t=TV(a.tv,a.token_file)
 if a.action=='get':print(json.dumps(t.request(a.route),indent=2))
 elif a.action=='exec':print(t.shell(a.file.read_text()))
 elif a.action=='node':print(t.node(a.file.read_text()))
 elif a.action=='put':t.put(a.file.read_bytes(),a.remote,a.mode);print('Transfer verified')
