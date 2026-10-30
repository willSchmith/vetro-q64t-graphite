# Home panel

## Edit the pinned apps

1. Open Vetro from the configured controller PC and select **Home panel**.
2. The preview shows your saved apps from left to right, followed by Settings and Sources.
3. Drag an app tile onto another tile or use the left/right arrows in its row.
4. Choose another app from a row's dropdown to replace that tile.
5. Select an app in the **Add an app** list and click **Add** to append it.
6. Click **Remove** to unpin an app. This does not uninstall or disable it.
7. Click **Save to TV**. Wait for the acknowledgement that the layout is active.
8. Press Home on the TV and check the order. Use **Discard changes** to return an unsaved draft to the last saved layout.

The list contains apps present in the TV's web-app catalog that are also verified as installed, enabled, menu-visible UI apps in the package registry. Disabled apps, hidden entries and background service components are excluded. An enabled system app without a user-facing catalog entry is not listed.

Settings and Sources remain fixed at the end. Sources reads the TV's connected-HDMI cache and uses the known device name, falling back to HDMI plus the port number. The native focused label follows remote selection; the browser preview highlights the first tile as an example.

The editor supports 1–38 apps plus the two system controls. A large row scrolls. Saving reloads native Evas objects in the existing dock process. It neither restarts the physical remote bridge nor closes the foreground video app.

## Conflicts and errors

A layout revision accompanies each edit. If another tab changes the layout, a stale save is rejected. Refresh the panel before editing again. The server re-reads the installed/enabled registry during save; an app disabled since the page loaded cannot be pinned. Duplicate IDs and arbitrary command strings are rejected.

The saved TSV is written atomically. When the dock is running, its in-process reload must acknowledge the exact new TSV. If acknowledgement fails, the previous layout is restored. When Graphite is off, the layout is stored for its next start.

A refresh intentionally discards the current draft and reads the TV again. Normal tab switching keeps an unsaved Home draft.

## Remote setup

1. Open **Remote** and select the detected Smart Control device.
2. Start listening and press a button to confirm the device and code.
3. Save mappings for the buttons you use.
4. Enable interception on the detected physical device, then check arrows, OK, Back and Home.

Codes observed on this remote:

| Code | Button | Configured action |
| ---: | --- | --- |
| 63 | Home | Toggle Graphite Home |
| 226 | Netflix | Launch Emby |
| 500 | Rakuten TV | Launch YouTube |
| 522 | Ambient short press | Block |
| 527 | Ambient long press | Block |
| 216 | Microphone hold/release | Open keyboard search |

The microphone rule uses a 650 ms hold threshold and triggers on release. It launches the keyboard search app; voice assistant services are not required for this behavior.

Codes and app IDs are device-specific. Capture the actual remote rather than assuming another remote uses the same values. The helper releases the physical device when its authenticated connection ends. Before the custom dock is ready, the Home event is forwarded to the native Home path.
