#!/usr/bin/env python3
"""Install only explicitly selected optional Q64T block profiles."""
import argparse,json,pathlib
from tv import TV
R=pathlib.Path(__file__).resolve().parents[1];p=argparse.ArgumentParser(description=__doc__);p.add_argument('--tv',required=True);p.add_argument('--token-file',required=True);p.add_argument('--services',action='store_true');p.add_argument('--app-groups',action='store_true');a=p.parse_args()
if not(a.services or a.app_groups):p.error('Select --services and/or --app-groups after reviewing docs/CHANGES.md')
t=TV(a.tv,a.token_file);boot=t.request('/telemetry')['boot_id']
if a.services:
 policy=json.loads((R/'root/optional-services-policy.json').read_text());policy.update(initialBootId=boot,verifiedBootIds=[])
 t.put((json.dumps(policy,indent=2)+'\n').encode(),'/opt/vetro-boot/optional-services.json')
 for n in ['optional-services.sh','restore-optional-services.sh']:t.put((R/'root'/n).read_bytes(),'/opt/vetro-boot/'+n)
 print(t.shell('/bin/sh -c "$(cat /opt/vetro-boot/optional-services.sh)" vetro-services apply'))
if a.app_groups:
 base='/opt/vetro-boot/blocked-apps/';t.shell('mkdir -p '+base+'\nchmod 700 '+base);policy=json.loads((R/'root/app-blocks-policy.json').read_text());policy.update(initialBootId=boot,verifiedBootIds=[])
 t.put((json.dumps(policy,indent=2)+'\n').encode(),base+'policy.json');t.put((R/'root/app-blocks.sh').read_bytes(),base+'apply.sh');t.put((R/'root/app-blocks-verify.js').read_bytes(),base+'verify-running.js');t.put(b'1\n',base+'enabled')
 print(t.shell('/bin/sh -c "$(cat /opt/vetro-boot/blocked-apps/apply.sh)" vetro-app-blocks apply'))
print('Selected profiles applied. Check their current state in Quick settings.')
