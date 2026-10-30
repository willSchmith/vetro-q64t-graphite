# Exact optional-service policy for the approved Q64T services; no network settings.
set -e
umask 077
ROOT=/opt/vetro-boot
MODE=${1:-apply}
[ "$(id -u)" = 0 ] || exit 1
case "$MODE" in
 boot|prepare) [ -f "$ROOT/optional-services.enabled" ] || exit 0;;
 apply) :;;
 *) echo INVALID_POLICY_ACTION >&2; exit 2;;
esac
SERVICES='ambient-ua-agent.service slive-provider-daemon.service sddp.service pvr-service.service gamepad-service.service com.samsung.tv.nfc-monitor.service'
ACTIVATORS='net.auad.busname org.tizen.tv.gamepadservice.busname slive-provider-daemon.path'
# Preflight all paths before creating a single override.
for u in $SERVICES $ACTIVATORS; do
 p=/run/systemd/system/$u
 if [ -e "$p" ] || [ -L "$p" ]; then
  [ -L "$p" ] && [ "$(readlink "$p")" = /dev/null ] || { echo "REFUSED_EXISTING_OVERRIDE $u" >&2; exit 1; }
 fi
done
[ -d /opt/usr/share/systemd/system ] || { echo NATIVE_MARKER_DIRECTORY_MISSING >&2; exit 1; }
rollback_on_error() {
 rc=$?
 if [ "$rc" != 0 ] && [ "$MODE" = apply ]; then
  echo POLICY_FAILED_RESTORING_PREVIOUS_STATE >&2
  /bin/sh -c "$(cat "$ROOT/restore-optional-services.sh")" || true
 fi
}
trap rollback_on_error EXIT
mkdir -p /run/systemd/system
for u in $SERVICES $ACTIVATORS; do
 p=/run/systemd/system/$u
 [ -L "$p" ] || ln -s /dev/null "$p"
done
# Native conditions supplement masks for the two services that support them.
touch /opt/usr/share/systemd/system/slive-provider-daemon /tmp/SDDP_NOT_SUPPORTED
chmod 600 /opt/usr/share/systemd/system/slive-provider-daemon /tmp/SDDP_NOT_SUPPORTED
chsmack -a _ /opt/usr/share/systemd/system/slive-provider-daemon
chsmack -a _ /tmp/SDDP_NOT_SUPPORTED
# Preparing masks is cheap and precedes native unit startup. Manager reload,
# stops and verification happen after the interactive services are available.
if [ "$MODE" = prepare ]; then echo OPTIONAL_SERVICE_MASKS_PREPARED; exit 0; fi
systemctl daemon-reload
for u in $ACTIVATORS; do systemctl stop "$u"; done
for u in $SERVICES; do systemctl stop "$u"; done
# These two exact service components are also registered as applications.
for app in com.samsung.tv.slive-daemon com.samsung.tv.nfc-monitor; do
 disabled=$(sqlite3 -readonly /opt/dbspace/.pkgmgr_parser.db "SELECT app_disable FROM package_app_info WHERE app_id='$app';")
 case "$disabled" in
  true) :;;
  false) pkgcmd -D -t app -n "$app" --global;;
  *) echo "APP_STATE_UNKNOWN $app" >&2; exit 1;;
 esac
done
for u in $SERVICES $ACTIVATORS; do
 systemctl show "$u" -p LoadState | grep -Fxq 'LoadState=masked' || { echo "MASK_NOT_CONFIRMED $u" >&2; exit 1; }
 state=$(systemctl is-active "$u" || true)
 case "$state" in active|activating|reloading|deactivating) echo "UNIT_NOT_STOPPED $u $state" >&2; exit 1;; esac
 printf 'BLOCKED %s %s\n' "$u" "$state"
done
touch "$ROOT/optional-services.enabled"
chmod 600 "$ROOT/optional-services.enabled"
/usr/bin/node -e 'var f=require("fs");f.writeFileSync("/opt/vetro-boot/optional-services-last.json",JSON.stringify({bootId:f.readFileSync("/proc/sys/kernel/random/boot_id","utf8").trim(),appliedAt:Date.now(),servicesStopped:6,activatorsBlocked:3})+"\n",{mode:384});'
echo OPTIONAL_SERVICES_BLOCKED
