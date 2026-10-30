# Start-to-finish guide

This is the complete project walkthrough for the Samsung **QE65Q64TAUXXH**, **T-NKLDEUC-2743.0**, **Tizen 5.5**, developed on Debian trixie. It covers the initial investigation, the installation path, the changes that remained, failed approaches that were replaced, and final validation.

Use [INSTALL.md](INSTALL.md) for the current command sequence. This document also records how the solution evolved; historical experiments are not additional steps to rerun on an already configured TV. No second factory-original device was used to repeat the packaged first-install procedure. The installed solution, updater and later restart checks were exercised on the documented TV.

## Reading order

| Stage | Detailed instructions |
| --- | --- |
| SDK, Developer Mode and certificates | [CERTIFICATES.md](CERTIFICATES.md) |
| Initial root and disposable RDP/SMB lab | [ROOT.md](ROOT.md) |
| Build, first installation, update and persistence | [INSTALL.md](INSTALL.md) |
| Home layout and remote mappings | [HOME-PANEL.md](HOME-PANEL.md) |
| Technical changes and optional policies | [CHANGES.md](CHANGES.md) |
| Acceptance tests and measurement limits | [VERIFICATION.md](VERIFICATION.md) |
| Setup/debugging failures and fixes | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Recovery and removal of changes | [ROLLBACK.md](ROLLBACK.md) |
| Images and offline dashboard export | [SCREENSHOTS.md](SCREENSHOTS.md) |
| Publishing the prepared repository | [PUBLISH.md](PUBLISH.md) |

## Phase A — initial connection and root entry

### 1. Identify the hardware and required features

Record the exact model, firmware and Tizen version before selecting a method. The workstation already had SDB and Tizen Studio; Podman was available for the disposable lab. Record the TV and controller addresses privately and substitute them for the documentation examples.

The required usage profile became Emby, YouTube, HBO Max, Prime Video, connected HDMI inputs, HDMI-CEC, optical audio and Wi-Fi. Preserve the remote's Bluetooth path, DRM, app runtimes and AV dependencies. Later service work explicitly excluded Wi-Fi, its configuration and DNS changes.

**Check:** the physical TV's information panel and SDB refer to the intended model. A similar model year is not a compatibility result.

### 2. Enable development access

Enable Developer Mode, register the controller PC address and connect the TV through Device Manager/SDB. The TV had Developer Mode enabled before the root attempts. Reconnect SDB after full restarts if its device list becomes empty.

**Check:** SDB lists the target. This TV's disabled ordinary shell remains a limitation; supported file staging and app operations are still useful.

### 3. Review the proposed repositories

The initial root candidate was [samsung-tv-root](https://github.com/chris-ritsen/samsung-tv-root). Vetro was then evaluated separately as the management/dashboard software. The delivered installation ultimately used the [tiz0wn Remote PC/CIFS research](https://github.com/sebastianspicker/tiz0wn) for its root entry.

At the time, the upstream discussion described changes for automatic probe-service startup and Node 4.4 compatibility on a 2020 Tizen 5.5 TV, associated with [Vetro PR #33](https://github.com/andrearicci93/vetro/pull/33). Running Vetro on an old Node runtime and obtaining root were distinct questions. A dashboard responding successfully was not proof that root-dependent actions could work.

**Check:** keep runtime compatibility, root entry and persistence as separate results.

### 4. Build and check the temporary RDP/SMB server

Use the disposable Podman lab in ROOT.md. Verify local services before entering anything on the TV. RDP must establish the Remote PC desktop and SMB must authenticate the same literal credential and advertise its share.

Several short credential spellings were investigated for usability. Authentication problems led to changing the lab credential and rechecking both sides. Changing only the TV's saved password was insufficient when the RDP/SMB server still expected a previous value.

**Check:** the credential in the TV profile is exactly the credential used by both lab services. Terminal output inside Remote PC belongs to the container user, not the TV.

### 5. Trigger and verify the first bounded UID-0 command

On the TV, connect to Remote PC and choose Shared Folder. The first bounded proof used `id` and a fresh `/tmp` marker. The observed result showed a regular marker owned by UID/GID 0 whose contents began with `uid=0(root) gid=0(root)`.

The successful result established a root-command path on this TV. It did not yet establish a persistent root shell, a firmware-independent exploit, a working native dock or boot-time root.

**Check:** confirm marker freshness, owner and content using the independent classification/readback method in ROOT.md. A share-enumeration log alone is insufficient.

### 6. Stage and start the temporary Vetro port

Prepare the managed helpers and Vetro service archive, stage them in the owner SDK tools directory and execute the bootstrap through the verified root entry. The historical short command referred to a staged `/tmp/r` script. The current package instead generates a bootstrap credential referring directly to the owner staging path, as explained in ROOT.md.

For the historical dot/source spelling `$(. /tmp/r)`, the space between `.` and `/tmp/r` is significant. The spellings using shell redirection or `${IFS}` were troubleshooting attempts, not interchangeable passwords to type against an unchanged server.

SDB staging on this TV did not permit arbitrary pushes to `/tmp`. Use the current documented owner staging path rather than assuming that a successful-looking transfer to another path placed a usable file there.

**Check:** `/status` reports UID 0 and Node v4.4.3; the dashboard is reachable from the allowed controller. Root is still temporary at this point.

## Phase B — working Vetro, signed app and persistent settings

### 7. Adapt the service to Tizen 5.5

Use the TV's signed Node binary and Node 4.4-compatible JavaScript. The port uses a loader that reads source as text and a separate root command worker, rather than assuming ordinary scripts or unsigned native ELF binaries can execute under this firmware's policies.

Root-dependent task control initially needed more than a working dashboard. Package registry, process control and command transport were connected to the root adapter. Native functionality was provided through managed helpers run by the signed .NET launcher. The TV Node process does not use the problematic child-process route for these operations.

**Check:** parse service modules on the TV's Node 4.4.3 as well as on the development machine. Check actual native actions and their readback, not just HTTP success.

### 8. Repair Certificate Manager and create the signing identity

The missing/wrong-path Certificate Manager error was resolved, Samsung certificate support was added and the signing profile was created as `vetro`. The connected TV's DUID was populated and used for target registration. The private value is not included in this repository.

Follow CERTIFICATES.md for the full signing flow. The author certificate and distributor certificate authorize the signed widget; neither provides root. Keep them outside the publication package.

**Check:** the signed package installs on the intended TV and its app/service IDs match `config.xml`.

### 9. Make HbbTV and MultiScreen changes survive

Simple stop actions and visual switch state did not prevent these features from returning. The retained HbbTV solution combines the native setting with global app-manager blocks for `org.tizen.hbbtv` and `org.tizen.hbbtv-service`. MultiScreen combines its app block with the firmware-supported `multiviewnotsupport` marker.

The Vetro switches read native state and support reversal. They distinguish a saved block from a process that is still running. Later full restarts verified the retained configuration.

The automatic-firmware-update switch was also read back as disabled in the final dashboard snapshot. This setting is distinct from root persistence; a firmware replacement can still remove the boot hook.

**Check:** verify the stored flag/marker, native component state and live processes separately. Do not infer persistence from a stopped process alone.

### 10. Establish the remote mappings

Capture the actual remote buttons. An initial capture was repeated when the event reader was not yet operating; only the successful event capture was used as evidence. The retained mappings are Netflix 226 → Emby, Rakuten 500 → YouTube, and Ambient 522/527 → blocked.

The owner confirmed all three behaviors and ordinary arrows, OK and Back. Rules were saved in `vetro-remap.json`; at this stage, the active interception still depended on the temporary root session.

**Check:** saved rules and an active authenticated physical bridge are separate states. Show both in Vetro.

### 11. Clean up unwanted apps without confusing removal and blocking

The work separated package removal, persistent launch blocking, background-service suppression and hiding a Home item. Removing a tile alone did not accomplish the other three.

Recorded verified uninstalls included Spotify, Viaplay, HBO GO (`8GRMGDJSAD`), a legacy HBO/HBONow package (`cj37Ni3qXM`), and SmartOne IPTV; M3U IPTV removal also produced a verified result. The supported HBO Max entry was retained. Netflix and Rakuten were disabled and their unwanted launches blocked.

Disney+, Apple TV, CANAL+, SkyShowtime, MEGOGO and SWEET.TV required another pass because entries/components remained enabled or returned. The final guarded policy covers the identified UI and background components, with registry-change and periodic verification. Shared aria framework processes were not indiscriminately stopped.

**Check:** verify package identity and each component. Keep pre-change state. Do not promise that a delisted or unsupported app can be reinstalled from the store later.

### 12. Make the custom state visible in Vetro

The dashboard was extended to show native HbbTV/MultiScreen state, app blocks, Home entries, active mappings and persistence status. The owner confirmed that the custom settings and remote assignments were visible. Later language work translated these additions to English.

**Check:** a displayed enabled switch must correspond to current TV state. Unknown or stale results must not be presented as successful verification.

## Phase C — persistent root and a faster retained profile

### 13. Prepare, apply and verify the boot hook

A full restart originally removed the active root session and remapping. After explicit approval, a same-size 776-byte hook was prepared for `/etc/profile.d/bash_prompt_custom.sh`. Its single containing 4096-byte VDFS block was located, copied, checked and patched. The protected boot archive and original block were retained for rollback.

Preparation exercised the real profile-source loop in a child context, verified UID/GID, SMACK and capabilities, and checked archive/hash consistency. The write was followed by readback and actual kernel restarts. The first restart restored root but exposed a managed-helper SMACK loading problem. Setting the helper launch context locally to `System::Privileged` corrected that problem; another full restart verified both root and the remote bridge.

**Check:** use the exact prepare/check/apply commands in INSTALL.md, retain the per-TV original backup and require a new kernel boot before claiming persistence. Do not reuse raw block bytes from another TV.

### 14. Correct Ambient at every relevant layer

The Ambient button, Ambient UA Agent and the native Home component are different layers. The button was remapped, but Ambient could still be started from Home. Stopping the agent alone did not remove that item.

The native component visibility command for `s/ambient` was identified and reapplied for a newly initialized native Home process. Reloading Home after the command removed the item, as confirmed by the owner. The later custom bar contains no Ambient entry. Original Samsung mode retains the separate native visibility policy.

**Check:** test the physical button and the Home item independently; do not claim all Ambient processes are blocked because one button is disabled.

### 15. Apply only the approved six-service profile

The approved set was Ambient UA Agent, Slive provider, SDDP, PVR service, gamepad service and NFC monitor. Six services and three exact activators were masked; native markers and the matching registered components were included where required. Boot restoration uses the existing root hook, without another raw system-partition patch.

Wi-Fi, Wi-Fi Presence, DNS, Bluetooth remote support, HDMI-CEC and required AV runtimes were excluded from this profile. The history includes broader candidate lists, but they were not blanket authorization to disable every candidate.

**Check:** reject startup of the exact masked units, confirm their live state, then verify restoration after full restart. See the explicit opt-in commands in INSTALL.md.

### 16. Measure before claiming speed improvements

The first broader measurements included YouTube playback and menu interaction; they were not equivalent to idle benchmarks. CPU percentage per process, total CPU, shared RSS and logical ZRAM size were treated separately. The observations did not justify overclocking, disabling memory compression, repeated cache drops or deleting system runtimes.

Full Settings remained the main complaint. Zeroing Home animations and reloading Settings produced little or no perceived improvement. The retained native animation factor became **0.2**, verified in the saved Elementary profile and the live Edje runtime. Other experimental effect flags were restored. Restricting menu logging produced no established material improvement, so the logging changes were reverted.

**Check:** do not describe the animation change as a proven solution to every slow settings tab. Preserve the limitation in the final report.

### 17. Speed up the command transport

The original request/worker/result path polled in two 100 ms cycles. FIFO wakeups and filesystem completion notifications replaced that delay, with a one-second recovery scan retained.

On the recorded trivial-command round trips, the median changed from **211.79 ms** to **38.59 ms**. This measured command dispatch and response, not application cold-start time or Samsung Settings tab latency.

**Check:** validate stdout, stderr, nonzero exit codes, concurrent requests and both fallback paths. Save the matching archive and manifest together.

## Phase D — Graphite interface and correct Home return

### 18. Define the compact interface

The final design requested a centered, small Home bar with a black background at 70% opacity, existing app shortcuts and Sources, without Samsung account/notification panels, Apps or Search in Home. The visual reference was glass-home-samsung-tv, while the delivered bar uses native EFL drawing in a resident managed process.

The full settings layout retains Picture, Sound and General. Apps belongs under General. The default terrestrial-TV/TV shortcut was removed from the custom bar and Sources; this did not uninstall the entire TV-viewer/AV stack.

**Check:** the bar starts hidden rather than launching a full-screen Vetro dashboard at boot.

### 19. Repair the settings integration

An early layout change caused Settings to hang. Investigation identified the actual split menu JSON files and the requirement for the native user to read the overlaid resources. The retained solution uses the split `mainmenu.json` and `system.json`, preserves the mandatory source corner entry and supplies readable resources with appropriate SMACK labeling.

Apps was renamed appropriately, given a right-side description and wired to the native Samsung Apps action. The owner confirmed the name, description and store launch. About this TV was added at the bottom of General using the native information action, with model/firmware data and a Tizen 5.5 description. Graphite colors were extended to the related menu/popup resources.

**Check:** re-open the actual native Settings process after resource changes. Merely bringing an already cached process forward does not prove it loaded new resources.

### 20. Add focused labels and detected HDMI entries

The custom bar removed the unwanted TV item. App names appear on focus. Sources uses the TV's connection cache, showing only connected HDMI ports; known names take precedence over generic port labels. The owner confirmed the two observed ports and the recognized PlayStation name.

**Check:** update the inputs file when the native source cache changes and rebuild the panel's objects without leaking the old ones. Do not fabricate a device name when the TV does not know it.

### 21. Add microphone-hold keyboard search

The microphone button was captured as code 216. The retained action uses a 650 ms hold threshold and fires on release, opening the keyboard search app. The owner chose keyboard search rather than restoring voice-assistant services.

**Check:** short clicks, repeats and a disconnected/restarted helper must not trigger an unintended held action. The owner confirmed search opened.

### 22. Add the Samsung / Graphite switch

The appearance switch coordinates the native resource overlays and custom dock. Samsung restores the original resource/renderer paths; Graphite restores the custom resources and hidden resident bar. Earlier remote mappings and app/service policy are separate and remain in effect.

**Check:** test switching in both directions, native settings restoration and the physical Home policy. The final resource set contains eight overlays.

### 23. Eliminate the original Home flash

Returning with Back initially showed both bars, or showed Samsung Home for about a second before the custom bar. A post-display observer that closed native Home was too late.

The show decision in `CsfsShowController.SetWindowVisible(bool,bool)` was changed in a generated managed copy so it notifies the custom bar before the native window is mapped. The first attempt at only the IL path did not take effect because the TV loaded its precompiled native-image copy. The retained approach overlays both verified paths. The builder checks 73 other method bodies unchanged, and failed/missing notification falls back to the original show path.

Thirty compositor samples kept the native Home window unmapped during the return test. The owner confirmed that the custom Home appeared immediately without the original bar flash. Automatic hiding was set to five seconds, with 0.2-second animations retained.

**Check:** test return from Settings, normal app transitions, arrows/OK/Back and idle hiding. This is a different issue from full cold-boot readiness.

### 24. Shorten cold-start restoration

The custom behavior initially took roughly 30–45 seconds to become available. Measurement exposed a second remote-bridge launch: the first policy lacked Home code 63, then the bridge restarted when the dock became ready.

The retained setup includes Home in the initial policy, forwards Home to the native path while the custom bar is not ready, reads input inventory directly and postpones optional background verification. One controlled comparison improved the complete mapping milestone from **36.89 s** to **20.04 s**. A later Home-panel restart test authenticated the remote at **13.78 s** and first observed complete Home readiness at **28.11 s**.

**Check:** report remote readiness, dock process creation, usable Home and completion of background checks separately. The later values show variability; do not promise instant cold start or use a process-created timestamp as a ready timestamp.

## Phase E — editable Home, English interface and publication

### 25. Add Home panel

The new Vetro tab reads installed/enabled, catalog-visible UI apps, displays the row in TV order and supports dropdown replacement, add, unpin, drag/drop and arrow reordering. Settings and Sources remain fixed. Saving writes the layout atomically and requests an in-process reload; the exact new TSV must be acknowledged.

Live tests covered reorder/add/remove, minimum size, duplicates, disabled or command-like app IDs, stale revisions, matching native acknowledgement and original-order restoration. The dock PID and remote connection did not change on tile edits.

**Check:** use HOME-PANEL.md to operate the editor; removing a pin is not an uninstall.

### 26. Verify layout persistence and translate Vetro

A one-app layout survived a full kernel restart, proving that boot did not silently regenerate the old row or require Emby/YouTube to be present in the saved list. The previous four-app order was restored without restarting the dock or remote connection.

Custom Vetro controls, theme summaries, remote descriptions, service names, errors and the new editor were translated to English. Native TV labels remain independent of the dashboard language.

**Check:** refresh the browser after the update. App titles from the TV's own catalog are not arbitrary UI strings to translate.

### 27. Fix and verify the updater's controller-file write

A repeat update exposed a controller-allowlist failure: truncating the live controller-address file blocked subsequent LAN API requests. Root, Home and the remote remained active locally.

Controller access was recovered through an authorized SDB loopback forward and the existing administrative token. A temporary signed diagnostic app used during investigation was removed; staging files were cleaned and the administrative token was rotated. The retained updater writes a pending controller file, checks its content and atomically renames it. It also checks the requested controller address against the connection's source address. The corrected updater completed successfully on the TV.

**Check:** use the documented `tools/recover-controller.py` procedure for that specific lockout. No additional system-partition write is required. See ROLLBACK.md.

### 28. Prepare the English GitHub package

The publication contains source, managed helpers, theme-generation tools, root/persistence preparation, an updater, optional policies, recovery tools, tests and English setup/rollback documentation. Original Samsung firmware, native assemblies, Eet archives, raw blocks, certificate material and private identifiers are not distributed.

Home and Sources captures are actual TV compositor client buffers. The offline English dashboard export is identified as an export. Dashboard-page screenshots are not included in this snapshot. The native images show only the TV interface.

Checks covered service/embedded-script syntax, backend selection validation, Python syntax, compatibility-profile hashes, hook size, local documentation links and exclusion of firmware/private files. The ZIP was read back and file hashes verified.

**Check:** use PUBLISH.md to review and publish to your own repository. Publishing to GitHub itself was not performed by this preparation step.

## Final configuration and limits

| Area | Retained result |
| --- | --- |
| Root | Automatic after verified full kernel restarts |
| Dashboard | English Vetro interface and current-state summaries |
| Home | Compact Graphite bar; editable row; Settings and Sources fixed |
| Native Home return | Pre-map interception, with original-code fallback |
| Remote | Netflix → Emby; Rakuten → YouTube; Ambient blocked; held microphone → keyboard search |
| Settings | Picture, Sound, General; Apps and About this TV under General |
| HbbTV / MultiScreen | Native persistent blocks and actual-state readback |
| Automatic firmware updates | Reported disabled in the final dashboard snapshot; future firmware compatibility is not guaranteed |
| Six services | Exact optional profile and activators restored at boot |
| Guarded apps | Disney+, Apple TV, CANAL+, SkyShowtime, MEGOGO, SWEET.TV components |
| Legacy app cleanup | Verified removals distinguished from blocks and hidden entries |
| Animations | Factor 0.2 retained; no claim that it solved all settings latency |
| Required connectivity | Wi-Fi/DNS and required AV/remote dependencies preserved by the profile |
| Publication | English source/docs, native captures, redacted evidence and verified archive |

Two requests need separate treatment when reproducing the project: forcing YouTube as the power-on app is not equivalent to enabling “last app,” and a generic Auto Start option does not prove it will override HDMI-CEC source changes. That request appeared in the work, but the final release evidence does not certify unconditional YouTube launch on every power-on. Similarly, the availability of advertising/voice/DNS switches is not proof that every such feature was disabled in the final profile. Use the actual state summaries and explicit policy list.

The final tests validate this TV and its recorded configuration. They do not guarantee future app-store reinstallation, compatibility after a firmware update, uninterrupted operation for a fixed number of years, or identical results on another model.
