# Verification

## Before restart

1. Require UID 0 and Node v4.4.3 in `/status`.
2. Read `/appearance`: the selected and active theme must agree; the native dock must be ready; `homeReturn.active` must be true for Graphite.
3. Read `/input`: the detected remote must be connected with the intended blocked codes.
4. Change Home order and save. Require a native acknowledgement and verify that the dock PID and remote `connectedUptime` stay unchanged.
5. Open Settings, then press Back. Verify that the original Home does not flash and the custom bar appears immediately.
6. Wait five seconds without input and verify that the custom bar hides.
7. Check source labels against actual connected HDMI devices.
8. Check Emby, YouTube, HBO Max, Prime Video, HDMI-CEC, optical audio and Wi-Fi normally.

## Full restart

A standby wake is not a persistence test. Compare `/telemetry.boot_id` before and after a controlled full restart. Require a changed kernel boot ID, automatic root, the selected theme, active Home redirect, restored mappings, saved app order and the intended app/service blocks. Raw boot identifiers are local verification data and are not included in the public evidence file.

The complete background guard check may finish after Home becomes usable. Record its completion separately from interface readiness. Use `/proc/uptime` or process ticks with the TV's actual `getconf CLK_TCK` value; the tested TV reports 250. Wall time may jump during startup as time synchronizes.

## Observed results

- Full kernel restarts restored root, theme, mappings and the guarded app groups.
- A native observer-only approach still flashed Samsung Home; the generated pre-map renderer interception removed that flash.
- The owner confirmed the resulting immediate return from Settings.
- Thirty native Home window samples stayed unmapped in the recorded return test.
- Pure native logic suite: 5015 checks, zero failures.
- Home panel tests: reorder, add, remove, minimum app count, disabled/duplicate/invalid ID rejection, stale revision rejection, exact reload acknowledgement, original order restoration, unchanged dock PID and unchanged remote connection.
- Controller-configurable release updater exercised successfully on the tested TV.
- Native settings animation factor remains 0.2; animation-only testing did not establish a noticeable speedup.

See `evidence/validation.json`. A single tested device does not establish compatibility for every 2020 TV, firmware version or remote.

## Final Home panel restart check

A one-app Home layout survived a full kernel restart. The previous four-app order was restored in place afterward, with the same dock PID and the same remote connection. Remote authentication occurred at 13.78 s, while complete Home readiness was first observed at 28.11 s in this run. This later observation demonstrates cold-start variability and is kept separate from the earlier 20.04 s mapping measurement.
