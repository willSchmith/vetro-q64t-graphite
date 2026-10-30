#!/usr/bin/env python3
"""Repair only the controller allowlist through an already authorized SDB connection."""
import argparse,ipaddress,json,pathlib,shlex,subprocess,urllib.request
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--sdb',default='sdb');p.add_argument('--serial',required=True);p.add_argument('--controller-ip',required=True);p.add_argument('--token-file',type=pathlib.Path,required=True);p.add_argument('--local-port',type=int,default=18099);a=p.parse_args();ip=str(ipaddress.IPv4Address(a.controller_ip))
assert 1024<=a.local_port<=65535;prefix=[a.sdb,'-s',a.serial];local='tcp:'+str(a.local_port)
subprocess.run(prefix+['forward',local,'tcp:8099'],check=True)
try:
 code='var f=require("fs");f.writeFileSync("/opt/vetro-boot/controller-ip.recovered",'+json.dumps(ip+'\n')+',{mode:384});f.renameSync("/opt/vetro-boot/controller-ip.recovered","/opt/vetro-boot/controller-ip");console.log("Controller allowlist restored")'
 command='/usr/bin/node -e '+shlex.quote(code);req=urllib.request.Request('http://127.0.0.1:'+str(a.local_port)+'/exec',data=json.dumps({'cmd':command}).encode(),headers={'Content-Type':'application/json','X-Vetro-Exec-Token':a.token_file.read_text().strip()})
 with urllib.request.urlopen(req,timeout=30) as response:result=json.load(response)
 if not result.get('ok'):raise RuntimeError('Controller repair not confirmed')
 print(result['output'].strip())
finally:subprocess.run(prefix+['forward','--remove',local],check=False)
