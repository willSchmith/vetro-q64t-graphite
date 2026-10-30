umask 077
ROOT=/opt/vetro-boot
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
export XDG_RUNTIME_DIR=/run
export DISPLAY=:0
[ "$(/usr/bin/id -u)" = 0 ] || exit 0
if [ "$VETRO_BOOT_PROBE" = 1 ]; then
 /usr/bin/node -e 'var f=require("fs"),s=f.readFileSync("/proc/self/status","utf8"),p={uid:process.getuid(),euid:process.geteuid(),gid:process.getgid(),pid:process.pid,node:process.version,smack:f.readFileSync("/proc/self/attr/current","utf8").trim(),capEff:(s.match(/^CapEff:\s*(.*)$/m)||[])[1],bootId:f.readFileSync("/proc/sys/kernel/random/boot_id","utf8").trim(),mode:"probe-only",runs:f.existsSync("/opt/vetro-boot/probe.json")?JSON.parse(f.readFileSync("/opt/vetro-boot/probe.json","utf8")).runs+1:1,timestamp:Date.now()};f.writeFileSync("/opt/vetro-boot/probe.json",JSON.stringify(p,null,2)+"\n",{mode:384});'
 exit $?
fi
exec >> "$ROOT/boot.log" 2>&1
printf '\nBOOT_START '; date -u
/usr/bin/node -e 'var f=require("fs"),s=f.readFileSync("/proc/self/status","utf8");f.writeFileSync("/opt/vetro-boot/last-entry.json",JSON.stringify({uid:process.getuid(),euid:process.geteuid(),gid:process.getgid(),smack:f.readFileSync("/proc/self/attr/current","utf8").trim(),capEff:(s.match(/^CapEff:\s*(.*)$/m)||[])[1],bootId:f.readFileSync("/proc/sys/kernel/random/boot_id","utf8").trim(),uptimeSeconds:parseFloat(f.readFileSync("/proc/uptime","utf8")),timestamp:Date.now()},null,2)+"\n",{mode:384});'
# Restore the owner's selected native interface resources.
if [ -r "$ROOT/graphite-home/selection" ] && [ -r "$ROOT/graphite-home/apply.sh" ]; then
 theme_selection=$(cat "$ROOT/graphite-home/selection")
 case "$theme_selection" in
 graphite|samsung) /bin/sh -c "$(cat "$ROOT/graphite-home/apply.sh")" vetro-theme "$theme_selection" || echo THEME_POLICY_FAILED ;;
 esac
fi
# Install the existing optional masks early, without blocking on service stops.
if [ -f "$ROOT/optional-services.enabled" ] && [ -r "$ROOT/optional-services.sh" ]; then
 /bin/sh -c "$(cat "$ROOT/optional-services.sh")" vetro-services prepare || echo OPTIONAL_MASK_PREPARE_FAILED
fi
# Validate the protected archive before extracting any root code.
/usr/bin/node -e 'var f=require("fs"),c=require("crypto"),m=JSON.parse(f.readFileSync("/opt/vetro-boot/manifest.json","utf8"));if(c.createHash("sha256").update(f.readFileSync("/opt/vetro-boot/port.tar.gz")).digest("hex")!==m.archiveSHA256)process.exit(1);' || exit 0
# A duplicate call must never replace an already running Vetro instance.
if /usr/bin/curl -fsS --max-time 2 http://127.0.0.1:8099/status | /bin/grep -q '"uid": 0'; then echo ALREADY_RUNNING; exit 0; fi
D=/run/vetro-q64t
if [ -e "$D" ]; then echo REFUSED_EXISTING_RUN_DIRECTORY; exit 0; fi
mkdir -m 700 "$D" || exit 0
/bin/tar --no-same-owner --no-same-permissions -xzf "$ROOT/port.tar.gz" -C "$D" || exit 0
cd "$D" || exit 0
mkdir -m 700 queue || exit 0
touch active
mkdir -p /opt/usr/apps/vetrotvapp/bin || exit 0
cp "$D/native-helper/VetroRemoteInput.dll" /opt/usr/apps/vetrotvapp/bin/VetroRemoteInput.dll || exit 0
chmod 755 /opt/usr/apps/vetrotvapp/bin /opt/usr/apps/vetrotvapp/bin/VetroRemoteInput.dll
chsmack -a _ /opt/usr/apps/vetrotvapp/bin
chsmack -a _ /opt/usr/apps/vetrotvapp/bin/VetroRemoteInput.dll
# Restore the selected native Home implementation; it starts hidden in the backend.
if [ -f "$D/native/dock/tvlauncher-dotnet.dll" ]; then
 mkdir -p /opt/usr/apps/vetrotvapp/bin/dock
 cp -r "$D/native/dock/." /opt/usr/apps/vetrotvapp/bin/dock/ || exit 0
 find /opt/usr/apps/vetrotvapp/bin/dock -exec chsmack -a _ {} \;
fi
/usr/bin/setsid /bin/bash -c "$(cat worker.sh)" </dev/null >worker.log 2>&1 3>&- &
echo $! >worker.pid
VETRO_BOOT_AUTOSTART=1 VETRO_PORT=8099 /usr/bin/setsid /usr/bin/node -e "$(cat loader.js)" </dev/null >node.log 2>&1 3>&- &
echo $! >node.pid
# The pilot and Home have priority. Existing app bans remain in the package DB;
# stop/verification tasks no longer hold their startup behind systemctl and SDK calls.
/usr/bin/setsid /bin/sh -c '
 sleep 35
 if [ -f /opt/vetro-boot/blocked-apps/enabled ]; then
  /bin/sh -c "$(cat /opt/vetro-boot/blocked-apps/apply.sh)" vetro-app-blocks guard || echo APP_BLOCK_POLICY_FAILED
 fi
 if [ -f /opt/vetro-boot/optional-services.enabled ]; then
  /bin/sh -c "$(cat /opt/vetro-boot/optional-services.sh)" vetro-services boot || echo OPTIONAL_SERVICE_POLICY_FAILED
 fi
' </dev/null >"$ROOT/background-startup.log" 2>&1 3>&- 9>&- &
n=0
while [ "$n" -lt 30 ]; do
 if /usr/bin/curl -fsS --max-time 1 http://127.0.0.1:8099/status | /bin/grep -q '"uid": 0'; then echo ROOT_SERVICE_READY; exit 0; fi
 n=$((n+1)); sleep 1
done
echo ROOT_SERVICE_NOT_CONFIRMED
exit 0
