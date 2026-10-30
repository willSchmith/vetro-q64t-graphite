# Implementation and customization record

## Root and startup

Remote PC / CIFS supplied the initial bounded UID-0 command. The temporary port used the signed TV Node binary with a loader that reads JavaScript as text, avoiding the TV's execution restrictions on ordinary script files. A serial root worker performs the permitted system operations. The command API is token-protected and controller-address restricted.

Persistent root uses the existing `/etc/profile.d/bash_prompt_custom.sh` consumer. A 776-byte, same-size replacement starts the protected `/opt/vetro-boot/boot.sh` once per boot. Its containing 4096-byte block was backed up, changed with exact checks and read back. Full kernel restarts confirmed automatic root and remote operation on the tested TV. This is separate from Vetro's normal signed app and certificates.

Startup prioritizes the remote bridge and native Home. Home code 63 is included in the initial filter policy so the bridge does not launch a second time when the dock becomes ready. Optional stop/verification work runs later. The measured mapping milestone improved from 36.89 to 20.04 seconds after kernel startup.

## Native Home

The custom launcher is a small EFL notification window driven by the TV's signed .NET launcher. It stays resident while hidden, sleeps in the native main loop and reads commands through a FIFO. It does not run a constant full-screen browser surface.

The original Home's `CsfsShowController.SetWindowVisible(bool,bool)` is patched in a generated managed copy. Visible requests write a small request file before returning; hidden requests retain the original implementation. Missing backend readiness or a failed notification takes the original code path. The other 73 method bodies are checked unchanged by the builder. Both the IL assembly path and its native-image path receive reversible bind mounts because the TV otherwise uses the precompiled image.

The root backend watches the request file and writes directly to the resident dock FIFO. This removed the post-display kill/relaunch delay responsible for the original Home flash. Thirty compositor samples in the return test kept the Samsung Home window unmapped. The owner confirmed immediate return on screen.

## Theme and settings

The native resources are eight separate overlays: two palette JSON files, three Eet theme archives, the settings background PNG and the actual split `mainmenu.json` / `system.json` trees. The monolithic menu JSON is not the active settings tree on this firmware.

The main settings tree keeps Picture, Sound and General plus its required source corner entry. Apps is added under General using the native Samsung Apps launch action. About this TV reuses the native contact/support action and includes Tizen 5.5 in its description.

Palette changes preserve alpha and non-color metadata. The measured build compared every Eet entry: only the designated background images or `edje/file` changed in the relevant preparation stage. Resource sources must remain readable by native UID 5001 and have the correct SMACK label. The appearance switch unmounts only its own resource inodes.

## App and service policy

The tested profile preserves Emby, YouTube, HBO Max, Prime Video, HDMI, HDMI-CEC, optical audio and Wi-Fi. Wi-Fi services and DNS configuration were not changed as part of this profile.

Previously disabled/removed apps included Netflix, Rakuten TV, Gallery, Spotify, Viaplay, unsupported HBO variants and unwanted IPTV apps. Store reinstallation and regional app availability are independent of this project; unsupported or delisted apps are not guaranteed to be reinstallable.

The persistent guarded group covers Disney+, Apple TV, CANAL+, SkyShowtime, MEGOGO and SWEET.TV. It uses package/component IDs, blocks all identified components, reacts to registry changes and verifies running contexts. Shared aria framework components are not indiscriminately killed.

HbbTV uses its native setting and persistent app-manager flags. MultiScreen uses the firmware's supported marker plus the app block. The optional six-service profile covers Ambient UA Agent, Slive, SDDP, PVR, gamepad and NFC with their exact activation units. These are choices for this usage profile, not services universally safe to remove.

## Home panel and language

The new editor has server-side availability checks, unique validated app IDs, revision conflict detection, atomic files, native reload acknowledgement and rollback on failed application. Live tests covered reorder, add, remove, minimum size, duplicates, disabled apps, command-like strings, stale revisions, the unchanged dock PID and the unchanged remote connection.

Vetro's custom UI and API status descriptions are English. Native TV menu language is independent. Existing app titles are preserved.
