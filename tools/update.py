#!/usr/bin/env python3
"""Update an existing Q64T installation; preserve theme resources and app layout."""
import argparse,hashlib,ipaddress,json,pathlib,shlex,tarfile,time,socket
from tv import TV
R=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--tv',required=True);p.add_argument('--token-file',required=True);p.add_argument('--controller-ip',required=True);p.add_argument('--model',required=True,choices=['QE65Q64TAUXXH']);p.add_argument('--firmware',required=True,choices=['T-NKLDEUC-2743.0']);a=p.parse_args();controller=str(ipaddress.IPv4Address(a.controller_ip));t=TV(a.tv,a.token_file)
with socket.socket(socket.AF_INET,socket.SOCK_DGRAM) as route:
 route.connect((a.tv,8099));local_ip=route.getsockname()[0]
if local_ip!=controller:p.error('--controller-ip must match this connection source address; no files changed')
s=t.request('/status');assert s['self']['uid']==0 and s['self']['node']=='v4.4.3','Root Node 4.4.3 installation required'
assert t.read('/opt/vetro-boot/install-state.json'),'Use the first-install guide before this updater'
(R/'build').mkdir(exist_ok=True);archive=R/'build/port.tar.gz'
with tarfile.open(archive,'w:gz') as z:
 for f in sorted((R/'app').rglob('*')):
  if f.is_file():z.add(f,arcname=str(f.relative_to(R/'app')))
b=archive.read_bytes();sha=hashlib.sha256(b).hexdigest();t.put(b,'/opt/vetro-boot/port.tar.gz.pending');t.put((R/'root/boot.sh').read_bytes(),'/opt/vetro-boot/boot.sh.pending');t.put((controller+'\n').encode(),'/opt/vetro-boot/controller-ip.pending',0o600)
print(t.shell('set -e\nmkdir -p /opt/vetro-boot/backup/pre-home-panel-update /tmp/vetro-release\ncp -p /opt/vetro-boot/port.tar.gz /opt/vetro-boot/boot.sh /opt/vetro-boot/manifest.json /opt/vetro-boot/backup/pre-home-panel-update/\ntar -xzf /opt/vetro-boot/port.tar.gz.pending -C /tmp/vetro-release\n/bin/sh -n -c "$(cat /opt/vetro-boot/boot.sh.pending)"'))
print(t.node('var f=require("fs"),V=require("vm"),d="/tmp/vetro-release/service/";f.readdirSync(d).filter(function(n){return /\\.js$/.test(n);}).forEach(function(n){new V.Script(f.readFileSync(d+n,"utf8"));});var m=JSON.parse(f.readFileSync("/opt/vetro-boot/manifest.json","utf8"));m.archiveSHA256='+json.dumps(sha)+';f.writeFileSync("/opt/vetro-boot/manifest.json.pending",JSON.stringify(m,null,2)+"\\n",{mode:384});f.renameSync("/opt/vetro-boot/port.tar.gz.pending","/opt/vetro-boot/port.tar.gz");f.renameSync("/opt/vetro-boot/boot.sh.pending","/opt/vetro-boot/boot.sh");f.renameSync("/opt/vetro-boot/manifest.json.pending","/opt/vetro-boot/manifest.json");f.renameSync("/opt/vetro-boot/controller-ip.pending","/opt/vetro-boot/controller-ip");console.log("Archive and startup validated");'))
old=s['self']['pid'];dock=t.request('/appearance')['dock']['pid']
script='''(sleep 2
kill -TERM '''+str(old)+'''
if [ -r /proc/'''+str(dock)+'''/cmdline ] && tr "\\0" " " </proc/'''+str(dock)+'''/cmdline | grep -q /opt/usr/apps/vetrotvapp/bin/dock/tvlauncher-dotnet.dll; then kill -9 '''+str(dock)+'''; fi
rm -f /tmp/vetro-q64t-dock/tvlauncher.pid /tmp/vetro-q64t-dock/tvlauncher.fifo
cp -r /tmp/vetro-release/native/dock /opt/usr/apps/vetrotvapp/bin/
find /opt/usr/apps/vetrotvapp/bin/dock -exec chsmack -a _ {} \\;
cp /tmp/vetro-release/service/*.js /run/vetro-q64t/service/
cd /run/vetro-q64t || exit 1
VETRO_BOOT_AUTOSTART=1 VETRO_PORT=8099 setsid /usr/bin/node -e "$(cat loader.js)" </dev/null >node.log 2>&1 3>&- 9>&- &
echo $! >node.pid
) </dev/null >/opt/vetro-boot/release-update.log 2>&1 &
echo UPDATE_SCHEDULED'''
print(t.shell(script))
for i in range(60):
 time.sleep(1)
 try:
  now=t.request('/status',timeout=3);home=t.request('/appearance',timeout=3)
  if now['self']['pid']!=old and (home['selected']!='graphite' or home['dock']['ready']):
   panel=t.request('/home-panel');assert len(panel['entries'])>=3;print('PASS: root, Home panel and native dock ready; layout preserved.');break
 except Exception:pass
else:raise SystemExit('Update health check failed; see docs/ROLLBACK.md')
