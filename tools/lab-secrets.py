#!/usr/bin/env python3
"""Create private, disposable Remote PC lab credentials; never prints the TV token."""
import argparse,pathlib,secrets
p=argparse.ArgumentParser(description=__doc__);p.add_argument('mode',choices=['proof','bootstrap']);a=p.parse_args();d=pathlib.Path(__file__).resolve().parents[1]/'.private/lab';d.mkdir(parents=True,exist_ok=True,mode=0o700)
password='$(id>/tmp/x)' if a.mode=='proof' else '$(. /home/owner/share/tmp/sdk_tools/bootstrap.sh)'
for name,value in [('username','q60t'),('password',password),('share','Q6'+secrets.token_hex(5).upper())]:f=d/name;f.write_text(value);f.chmod(0o600)
print('Disposable username: q60t\nLiteral Remote PC password: '+password+'\nShare: '+(d/'share').read_text())
