#!/usr/bin/env python3
"""Prepare/check a device-specific root boot hook. Writes require an explicit flag."""
import argparse,hashlib,json,pathlib
from tv import TV
R=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description=__doc__);p.add_argument('action',choices=['prepare','check','apply','rollback']);p.add_argument('--tv',required=True);p.add_argument('--token-file',required=True);p.add_argument('--model',required=True,choices=['QE65Q64TAUXXH']);p.add_argument('--firmware',required=True,choices=['T-NKLDEUC-2743.0']);p.add_argument('--confirm-system-write',action='store_true');a=p.parse_args()
if a.action in ['apply','rollback'] and not a.confirm_system_write:p.error('--confirm-system-write is required')
t=TV(a.tv,a.token_file);base='/opt/vetro-boot/';private=R/'.private/persistence';private.mkdir(parents=True,exist_ok=True)
if a.action=='prepare':
 original=t.read('/etc/profile.d/bash_prompt_custom.sh')
 assert len(original)==776 and hashlib.sha256(original).hexdigest()=='effe97f8ec948a15962fc8a1b85a4e1e446352b8c5caae703e1ed0684425e33c','Original hook does not match this firmware, or persistence is already installed'
 t.put((R/'root/boot.sh').read_bytes(),base+'boot.sh');t.put((R/'root/profile-hook.sh').read_bytes(),base+'profile-hook-candidate.sh')
 print(t.node((R/'root/scan-rootfs.js').read_text()))
 prep='/opt/usr/home/owner/share/vetro-boot-preparation/';m=json.loads(t.read(prep+'scan-result.json'));assert len(m['matches'])==1 and m['blockBytes']==4096 and m['fileOffsetInBlocks']==0
 block=t.read(prep+'containing-blocks-original.bin');hook=(R/'root/profile-hook.sh').read_bytes();assert len(hook)==776;candidate=hook+block[776:]
 m.update(candidateSourceSHA256=hashlib.sha256(hook).hexdigest(),candidateBlockSHA256=hashlib.sha256(candidate).hexdigest(),archiveSHA256=hashlib.sha256(t.read(base+'port.tar.gz')).hexdigest())
 for name,data in [('original-block.bin',block),('candidate-block.bin',candidate),('manifest.json',(json.dumps(m,indent=2)+'\n').encode())]:(private/name).write_bytes(data)
 t.shell('mkdir -p /opt/vetro-boot/backup\nchmod 700 /opt/vetro-boot /opt/vetro-boot/backup')
 for name,data in [('backup/containing-blocks-original.bin',block),('containing-blocks-candidate.bin',candidate),('manifest.json',(json.dumps(m,indent=2)+'\n').encode()),('prompt-original.sh',original)]:t.put(data,base+name)
 profile=t.read('/etc/profile').decode();assert '. "$i"' in profile
 profile=profile.replace('. "$i"','if [ "$i" = /etc/profile.d/bash_prompt_custom.sh ]; then eval "$(/bin/cat /opt/vetro-boot/profile-hook-candidate.sh)"; else . "$i"; fi')
 t.put(profile.encode(),base+'profile-probe.sh')
 print(t.shell('set -e\necho _ >/proc/self/attr/current\nVETRO_BOOT_PROBE=1 /bin/bash -c \'. /opt/vetro-boot/profile-probe.sh\'\nn=0; while [ ! -r /opt/vetro-boot/probe.json ] && [ $n -lt 50 ]; do n=$((n+1)); sleep 0.2; done'))
 probe=json.loads(t.read(base+'probe.json'));assert probe['uid']==0 and probe['euid']==0 and probe['smack']=='_' and probe['capEff']=='0000003fffffffff' and probe['runs']==1
 print('Prepared and probed. No system partition bytes were written. Keep .private/persistence offline.');raise SystemExit(0)
m=json.loads(t.read(base+'manifest.json'));code=(R/'root/guarded-block-write.js').read_text().replace('ACTION',json.dumps(a.action)).replace('EXPECTED',json.dumps(m));print(t.node(code))
