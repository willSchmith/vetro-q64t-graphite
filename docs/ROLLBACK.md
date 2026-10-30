# Rollback

## Restore the original appearance

Open **Quick settings → TV appearance** and select **Samsung**. This removes the project's resource and renderer bind mounts, stops the custom dock and restores the native Home/settings layout. It keeps existing remote mappings and app/service blocks.

To stop remapping as well, turn interception off in Remote. The physical helper releases its device on disconnect. A full restart clears volatile mounts, but the boot hook reapplies the selected theme; select Samsung first if you want the original appearance to remain after restart.

## Restore the previous port after an update

The updater preserves `/opt/vetro-boot/backup/pre-home-panel-update/{port.tar.gz,boot.sh,manifest.json}`. While root is available, stop the new backend and use a detached root shell to restore all three files together, then fully restart. Do not mix an old archive with a new manifest hash.

The updater's root helper and the boot hook are different layers. If the API is unavailable but the TV boots, use the originally validated root entry to inspect and restore the protected backup. Avoid repeated blind reflashing.

## Undo the persistent root hook

Keep the per-TV original block and manifest generated under `.private/persistence/`. With the matching root API available:

```bash
python3 tools/persistence.py check \
  --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" \
  --model QE65Q64TAUXXH --firmware T-NKLDEUC-2743.0
python3 tools/persistence.py rollback --confirm-system-write \
  --tv "$TV_IP" --token-file "$VETRO_TOKEN_FILE" \
  --model QE65Q64TAUXXH --firmware T-NKLDEUC-2743.0
```

The writer accepts only the verified original or generated candidate currently on the active partition. It checks and restores the original block, flushes and reads it back. A full restart is still required to end the currently running root session. The rollback is not a rescue mechanism for a TV that cannot boot; that is why an offline original backup is required before applying the hook.

Never restore a block from another TV or bypass a mismatch by changing a recorded hash.

## Undo optional blocks

Turn off the relevant Quick settings switch, or enable the exact app components in Task manager. A persistent guard must be disabled before manually enabling one of its guarded apps. Remove only the corresponding project policy/marker, not unrelated system units. The six-service restoration helper reverses its own masks and markers; Wi-Fi is outside that helper's scope.

## Recover a controller allowlist lockout

If the backend is running but its controller-address file is empty or wrong, the already authorized SDB connection can forward the loopback API. The existing administrative token is still required:

```bash
"$SDB" connect "$TV_IP:26101"
python3 tools/recover-controller.py \
  --sdb "$SDB" --serial "$TV_IP:26101" \
  --controller-ip "$CONTROLLER_IP" --token-file "$VETRO_TOKEN_FILE"
```

The helper creates a temporary localhost forward, writes the corrected address to a new file, renames it atomically, then removes the forward. It does not install a TV app or write the system partition. The updater uses the same atomic-file principle for its controller configuration and checks that the requested controller address matches its connection source.
