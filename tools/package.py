#!/usr/bin/env python3
"""Create a local deployment archive and private first-root bootstrap."""
import argparse,hashlib,ipaddress,json,pathlib,secrets,tarfile
R=pathlib.Path(__file__).resolve().parents[1];p=argparse.ArgumentParser(description=__doc__);p.add_argument('--controller-ip',required=True);a=p.parse_args();ip=str(ipaddress.IPv4Address(a.controller_ip));D=R/'.private';D.mkdir(exist_ok=True,mode=0o700);(R/'build').mkdir(exist_ok=True)
key=D/'admin-token'
if not key.exists():key.write_text(secrets.token_hex(32)+'\n');key.chmod(0o600)
with tarfile.open(R/'build/port.tar.gz','w:gz') as z:
 for f in sorted((R/'app').rglob('*')):
  if f.is_file():z.add(f,arcname=str(f.relative_to(R/'app')))
# The literal is installed once on this TV; the generated file must stay private.
script='''umask 077
D=/run/vetro-q64t
[ ! -e "$D" ] || exit 1
mkdir -p /opt/vetro-boot
chmod 700 /opt/vetro-boot
printf '%s\\n' '''+key.read_text().strip()+''' >/opt/vetro-boot/admin-token
printf '%s\\n' '''+ip+''' >/opt/vetro-boot/controller-ip
mkdir "$D" || exit 1
tar --no-same-owner --no-same-permissions -xzf /home/owner/share/tmp/sdk_tools/port.tar.gz -C "$D" || exit 1
cp /home/owner/share/tmp/sdk_tools/port.tar.gz /opt/vetro-boot/port.tar.gz
mkdir -p /opt/usr/apps/vetrotvapp/bin
cp "$D/native-helper/VetroRemoteInput.dll" /opt/usr/apps/vetrotvapp/bin/
cp -r "$D/native/dock" /opt/usr/apps/vetrotvapp/bin/
find /opt/usr/apps/vetrotvapp/bin -maxdepth 3 -exec chsmack -a _ {} \\;
cd "$D" || exit 1
mkdir queue; touch active
setsid /bin/bash -c "$(cat worker.sh)" </dev/null >worker.log 2>&1 3>&- &
echo $! >worker.pid
VETRO_PORT=8099 setsid /usr/bin/node -e "$(cat loader.js)" </dev/null >node.log 2>&1 3>&- &
echo $! >node.pid
'''
(D/'bootstrap.sh').write_text(script);(D/'bootstrap.sh').chmod(0o600);print('Created build/port.tar.gz and .private/bootstrap.sh. Keep .private out of Git.')
