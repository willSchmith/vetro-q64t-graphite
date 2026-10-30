# Installation and update

For the complete setup history and decision sequence, including [observed problems and fixes](TROUBLESHOOTING.md), start with [START-TO-FINISH.md](START-TO-FINISH.md). For the missing-manager error, DUID registration, signing and widget installation, use [CERTIFICATES.md](CERTIFICATES.md).

## 1. Record the target

This profile is for **QE65Q64TAUXXH / T-NKLDEUC-2743.0 / Tizen 5.5**. Record the model and firmware from the TV's own information panel. Keep Wi-Fi, optical audio, HDMI and HDMI-CEC unchanged during setup. Do not copy another TV's raw system blocks.

Install Tizen Studio with TV tools and SDB. Turn on Developer Mode in Apps, enter the controller PC address and restart the TV as requested by Samsung. Use a trusted local network.

On Debian trixie:

```bash
sudo apt update
sudo apt install python3 python3-pil mono-mcs libmono-cecil-private-cil nodejs podman
export TV_IP=192.0.2.10
export CONTROLLER_IP=192.0.2.20
export SDB="$HOME/tizen-studio/tools/sdb"
"$SDB" connect "$TV_IP:26101"
"$SDB" devices
```

Replace the example addresses with the actual TV and controller addresses. Confirm the model shown by SDB. Developer Mode and an SDB connection do not themselves provide a root shell.

## 2. Build

Run these commands from the repository root:

```bash
sh tools/build.sh
node tests/check.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

The build creates managed helpers and local build tools. The TV's signed .NET launcher runs them. No unsigned native ELF executable is installed.

## 3A. Update an existing installation

Use this path if persistent root, Graphite resources and an existing Vetro API are already installed.

```bash
export VETRO_TOKEN_FILE=/path/to/your/private/admin-token
python3 tools/update.py \
  --tv "$TV_IP" --controller-ip "$CONTROLLER_IP" \
  --token-file "$VETRO_TOKEN_FILE" \
  --model QE65Q64TAUXXH --firmware T-NKLDEUC-2743.0
```

The updater verifies root and Node 4.4.3, backs up the existing port archive, checks every service module on the TV, updates the protected boot archive and performs a controlled service/dock reload. It keeps theme resources, app blocks and the saved Home row.

Refresh the browser page after the update. Open **Home panel** and confirm that your apps remain in the expected order. Follow [Home panel](HOME-PANEL.md).

## 3B. First installation

First obtain a bounded root proof using [ROOT.md](ROOT.md). Once that entry is confirmed:

```bash
python3 tools/package.py --controller-ip "$CONTROLLER_IP"
"$SDB" -s "$TV_IP:26101" push build/port.tar.gz /home/owner/share/tmp/sdk_tools/port.tar.gz
"$SDB" -s "$TV_IP:26101" push .private/bootstrap.sh /home/owner/share/tmp/sdk_tools/bootstrap.sh
```

Use the staged bootstrap through the root entry described in ROOT.md. The bootstrap creates a per-installation API token before launching the root service. Keep `.private/admin-token` private.

```bash
export VETRO_TOKEN_FILE="$PWD/.private/admin-token"
python3 tools/tv.py --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" get /status
```

Confirm UID 0 and Node v4.4.3. At this point the service is temporary until reboot.

## 4. Prepare the native theme

This step reads the TV's original resources and requires a root API. It refuses resources that do not match the recorded firmware hashes. Run it before enabling Graphite; an already modified TV should use the update path instead.

```bash
python3 tools/prepare-theme.py \
  --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" \
  --model QE65Q64TAUXXH --firmware T-NKLDEUC-2743.0
```

The tool generates eight resource candidates and the one-method Home renderer patch from the TV's originals. Original firmware stays on your TV and under your ignored `.private/` directory. This release does not distribute Samsung `.edj`, `.ni.dll` or rootfs binaries.

Open `http://<TV-IP>:8099` from the configured controller PC. In **Quick settings → TV appearance**, enable **Graphite**. Open Home on the remote and verify navigation, Settings and Sources. Configure the remote as described in [HOME-PANEL.md](HOME-PANEL.md).

## 5. Prepare persistent startup

This is separate from the reversible theme overlays. It modifies a verified 4096-byte block on the read-only VDFS system partition. An incorrect system-partition write can prevent the TV from booting. Keep the freshly generated original block and manifest offline before applying anything.

```bash
python3 tools/persistence.py prepare \
  --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" \
  --model QE65Q64TAUXXH --firmware T-NKLDEUC-2743.0
```

Preparation checks the original 776-byte hook, scans the active partition, requires one match at the expected block alignment, saves the original block, builds a same-size candidate and exercises the actual profile source loop in a child root context. It performs no system-partition write.

Copy `.private/persistence/` to separate offline storage. Then run the read-only check:

```bash
python3 tools/persistence.py check \
  --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" \
  --model QE65Q64TAUXXH --firmware T-NKLDEUC-2743.0
```

After reviewing the generated manifest, apply explicitly:

```bash
python3 tools/persistence.py apply --confirm-system-write \
  --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" \
  --model QE65Q64TAUXXH --firmware T-NKLDEUC-2743.0
```

The writer checks the active read-only VDFS partition, sizes, source hashes, original/candidate block hashes, bytes outside the hook, current block, root-context probe and protected port archive. It writes one block, flushes and reads it back. The original is retained for rollback.

Perform one full restart and follow [VERIFICATION.md](VERIFICATION.md). Persistence is confirmed only after a new kernel boot, not by a successful write response. Firmware updates can replace the boot hook.

## 6. Optional blocks and tuning

Apply app and service blocks after Home and the remote work. Use Quick settings for HbbTV, MultiScreen, privacy and automatic updates. In Task manager, verify app identities before disabling them. The six-service profile in `root/optional-services.sh` covers Ambient UA Agent, Slive, SDDP, PVR, gamepad and NFC; it excludes Wi-Fi.

Review [CHANGES.md](CHANGES.md) before applying those optional choices. The measured configuration preserves Emby, YouTube, HBO Max, Prime Video, connected HDMI inputs, HDMI-CEC, optical audio and Wi-Fi. Apps can depend on shared services, so do not treat the six-service profile as a universal debloat list.


To apply the exact optional profiles with an explicit command:

```bash
# Ambient UA Agent, Slive, SDDP, PVR, gamepad and NFC only:
python3 tools/optional-blocks.py --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" --services
# Disney+, Apple TV, CANAL+, SkyShowtime, MEGOGO and SWEET.TV groups only:
python3 tools/optional-blocks.py --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" --app-groups
```

These switches are opt-in and affect the named features. Inspect Quick settings and Task manager afterward, then verify the intended blocks after a full restart. Per-device boot identifiers are generated on the TV and stay out of the published source.
