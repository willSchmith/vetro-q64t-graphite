umask 077
ROOT=/opt/vetro-boot
rm -f "$ROOT/optional-services.enabled"
if [ -L /run/systemd/system/ambient-ua-agent.service ] && [ "$(readlink /run/systemd/system/ambient-ua-agent.service)" = /dev/null ]; then rm -f /run/systemd/system/ambient-ua-agent.service; fi
if [ -L /run/systemd/system/slive-provider-daemon.service ] && [ "$(readlink /run/systemd/system/slive-provider-daemon.service)" = /dev/null ]; then rm -f /run/systemd/system/slive-provider-daemon.service; fi
if [ -L /run/systemd/system/sddp.service ] && [ "$(readlink /run/systemd/system/sddp.service)" = /dev/null ]; then rm -f /run/systemd/system/sddp.service; fi
if [ -L /run/systemd/system/pvr-service.service ] && [ "$(readlink /run/systemd/system/pvr-service.service)" = /dev/null ]; then rm -f /run/systemd/system/pvr-service.service; fi
if [ -L /run/systemd/system/gamepad-service.service ] && [ "$(readlink /run/systemd/system/gamepad-service.service)" = /dev/null ]; then rm -f /run/systemd/system/gamepad-service.service; fi
if [ -L /run/systemd/system/com.samsung.tv.nfc-monitor.service ] && [ "$(readlink /run/systemd/system/com.samsung.tv.nfc-monitor.service)" = /dev/null ]; then rm -f /run/systemd/system/com.samsung.tv.nfc-monitor.service; fi
if [ -L /run/systemd/system/net.auad.busname ] && [ "$(readlink /run/systemd/system/net.auad.busname)" = /dev/null ]; then rm -f /run/systemd/system/net.auad.busname; fi
if [ -L /run/systemd/system/org.tizen.tv.gamepadservice.busname ] && [ "$(readlink /run/systemd/system/org.tizen.tv.gamepadservice.busname)" = /dev/null ]; then rm -f /run/systemd/system/org.tizen.tv.gamepadservice.busname; fi
if [ -L /run/systemd/system/slive-provider-daemon.path ] && [ "$(readlink /run/systemd/system/slive-provider-daemon.path)" = /dev/null ]; then rm -f /run/systemd/system/slive-provider-daemon.path; fi
rm -f /opt/usr/share/systemd/system/slive-provider-daemon
rm -f /tmp/SDDP_NOT_SUPPORTED
pkgcmd -A -t app -n com.samsung.tv.slive-daemon --global
pkgcmd -A -t app -n com.samsung.tv.nfc-monitor --global
systemctl daemon-reload
systemctl start ambient-ua-agent.service || true
systemctl start slive-provider-daemon.service || true
systemctl start sddp.service || true
systemctl start pvr-service.service || true
systemctl start gamepad-service.service || true
systemctl start com.samsung.tv.nfc-monitor.service || true
systemctl start net.auad.busname || true
systemctl start org.tizen.tv.gamepadservice.busname || true
systemctl start slive-provider-daemon.path || true
echo OPTIONAL_SERVICE_POLICY_RESTORED
