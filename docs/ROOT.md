# Root entry: Remote PC / CIFS

The entry used on the tested Q64T was the Remote PC Shared Folder path investigated by [tiz0wn](https://github.com/sebastianspicker/tiz0wn). User-supplied SMB credentials reach a privileged shell command in this firmware. A literal command substitution in the credential can execute a bounded command on the TV.

This is distinct from the alternative route in [samsung-tv-root](https://github.com/chris-ritsen/samsung-tv-root). Developer Mode and ordinary SDB access were prerequisites for staging files, not proof of root.

## 1. Prepare a disposable RDP/SMB host

Use the included adaptation of the pinned tiz0wn lab, preserving its MIT notice. Ports are bound to the controller's local address; permit access only from your TV. Do not forward RDP, SMB, SDB or the root API to the Internet.

```bash
python3 tools/lab-secrets.py proof
sudo podman build -t vetro-q64t-lab root/rdp-lab
sudo podman run --rm --name vetro-q64t-lab \
  -p "$CONTROLLER_IP:3389:3389" -p "$CONTROLLER_IP:445:445" \
  -v "$PWD/.private/lab:/run/q60t-secrets:ro" vetro-q64t-lab
```

The terminal prints the disposable username, share name and literal proof password. RDP and SMB must use the same credentials. The proof password is `$(id>/tmp/x)`; this is a literal input string, not a command to run on the controller PC. A longer first-stage bootstrap credential is generated separately.

## 2. Trigger a bounded proof

On the TV:

1. Open Remote PC / PC on TV.
2. Connect to the controller PC with the displayed disposable credentials.
3. Select Shared Folder once.
4. Inspect the lab log for the share enumeration.

Validate the newly created `/tmp/x` through an independent read channel or the guarded upstream classifier. Its owner must be UID 0 and its contents must start with `uid=0(root)`. A terminal inside the RDP desktop belongs to the container user and is not a TV root shell. A log entry or successful SMB login alone does not prove root.

The original implementation's two-push classifier is documented in the pinned [tiz0wn Remote PC research](https://github.com/sebastianspicker/tiz0wn/tree/8dd475a9028f2290f4c409945877be99d74d630b/research/remotepc-cifs-root). Use its verification contract when a direct read of `/tmp` is unavailable through SDB. A failed root proof is a stopping condition; do not proceed on the assumption that the same firmware family is enough.

## 3. Stage the temporary Vetro service

Build and stage `port.tar.gz` and `.private/bootstrap.sh` using INSTALL.md. SDB on this TV accepts the owner SDK staging directory; it does not accept arbitrary pushes to `/tmp`.

Stop the proof container, generate the bootstrap credential, then restart the lab:

```bash
sudo podman stop vetro-q64t-lab
python3 tools/lab-secrets.py bootstrap
sudo podman run --rm --name vetro-q64t-lab \
  -p "$CONTROLLER_IP:3389:3389" -p "$CONTROLLER_IP:445:445" \
  -v "$PWD/.private/lab:/run/q60t-secrets:ro" vetro-q64t-lab
```

Create a new Remote PC profile using the newly printed literal password and select Shared Folder. The generated password sources the script staged at `/home/owner/share/tmp/sdk_tools/bootstrap.sh`. It is longer than the proof password. Type or paste the exact string; preserve its space after the dot.

This package's direct owner-staging bootstrap spelling is a packaging adaptation. The bounded credential-substitution entry and Q64T bootstrap mechanism were observed on the tested TV; the newly packaged first-install sequence has not been repeated on a second factory-original device. Stop and inspect the TV/lab output if it does not produce the expected API response.

Confirm the root service using the generated token:

```bash
export VETRO_TOKEN_FILE="$PWD/.private/admin-token"
python3 tools/tv.py --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" get /status
```

Require UID 0, the expected model recorded separately, and Node v4.4.3. Continue with theme preparation in INSTALL.md. A running root service is still temporary until the separate boot hook has been applied and a full restart verified.

## 4. Clean up

Stop the disposable container, remove its Remote PC profile from the TV and remove the private lab credentials after verification. Keep only your API token and device-specific rollback backup in private offline storage. The root service accepts only the configured controller and loopback clients, and arbitrary command execution requires the per-installation token.
