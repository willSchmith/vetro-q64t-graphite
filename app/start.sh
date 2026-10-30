umask 077
D=/run/vetro-q64t
if test -d "$D"; then echo existing-run >&2; return 1; fi
mkdir "$D" || return 1
/bin/tar -xzf /home/owner/share/tmp/sdk_tools/vetro-q64t.tar.gz -C "$D" || return 1

# Q64T managed input helper uses the TV's signed .NET launcher in corerun mode.
mkdir -p /opt/usr/apps/vetrotvapp/bin
cp "$D/native-helper/VetroRemoteInput.dll" /opt/usr/apps/vetrotvapp/bin/VetroRemoteInput.dll
chmod 755 /opt/usr/apps/vetrotvapp/bin /opt/usr/apps/vetrotvapp/bin/VetroRemoteInput.dll
chsmack -a _ /opt/usr/apps/vetrotvapp/bin
chsmack -a _ /opt/usr/apps/vetrotvapp/bin/VetroRemoteInput.dll

cd "$D" || return 1
mkdir queue; touch active
/usr/bin/setsid /bin/bash -c "$(cat worker.sh)" </dev/null >worker.log 2>&1 3>&- &
echo $! >worker.pid
VETRO_PORT=8099 /usr/bin/setsid /usr/bin/node -e "$(cat "$D/loader.js")" </dev/null >node.log 2>&1 3>&- &
echo $! >node.pid
