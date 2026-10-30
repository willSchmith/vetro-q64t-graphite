# Problems encountered and their retained fixes

This table records the actual setup/debugging path. It is not a list of extra changes to apply to a working installation.

| Symptom | What was learned | Retained action or verification |
| --- | --- | --- |
| SDB device list empty after restart | A previous developer connection did not survive the full reboot | Reconnect the explicit TV address and verify the model |
| SDB connects but ordinary shell output is unavailable | Developer access is restricted on this firmware | Use supported staging/install operations; do not equate SDB with root |
| Certificate Manager missing or wrong-path error | SDK tool and extension setup was incomplete/inconsistent | Repair the manager installation/path, add Samsung certificate support, then create the `vetro` profile |
| A DUID appeared automatically | It is target registration data, not an account password or profile name | Verify it against the connected TV; keep it out of the publication |
| Widget installation fails with a spaced filename | The same signed package installed with a simple filename | Use a name such as `vetro.wgt`; also verify certificate, DUID and app IDs |
| RDP/SMB password accepted on one side but not the other | The TV profile and disposable services could be using different saved credentials | Regenerate/restart consistently; check the exact literal in RDP and SMB |
| Short payload spellings behaved differently | Redirection, `${IFS}` and dot-plus-space spellings are not interchangeable inputs | Use the exact credential generated for the matching lab stage |
| A Shared Folder click produced only a server log | The log proved a request, not UID 0 on the TV | Require a fresh root-owned marker and its actual `id` contents |
| File staging to `/tmp` fails | The SDK staging path is not an unrestricted filesystem write channel | Stage under the owner SDK directory and follow the documented bootstrap path |
| Dashboard opens but native task control fails | Service compatibility does not grant root | Verify the root adapter and native operation readback separately |
| A JavaScript service fails on the 2020 TV | The service runtime is Node 4.4.3 | Use compatible service modules and test parsing on the TV |
| A signed managed helper prints no ordinary stdout | The launcher can redirect output to native logs | Have the helper write an explicit proof file; do not treat empty stdout as success or failure |
| Root command queue stops answering while dashboard still responds | HTTP availability is not worker health | Inspect authenticated `/exec?diagnostics=1`; the recorded incident required one controlled full restart |
| Root works after reboot but remote mappings do not | The managed helper encountered SMACK loading restrictions | Set the launch context only for that helper; verify another full restart |
| Vetro opens full screen at boot | The TV widget and hidden background service were being confused | Start the protected service and hidden native dock; avoid foregrounding the widget as a boot action |
| HbbTV or MultiScreen returns | Stopping a process alone does not prevent relaunch | Use native settings, persistent app flags and the firmware marker; read back each layer |
| Ambient button is blocked but Home still opens Ambient | Button, agent and Home component are separate | Block the button and agent separately; hide the native component or omit it from the custom Home |
| Native quick icons reappear after exiting an app | Native Home can rebuild its own cached row | Keep a separate saved row for Graphite Home rather than repeatedly rewriting only a transient native view |
| Full Settings still feels slow after animation changes | A shorter animation is not a complete latency diagnosis | Keep factor 0.2 as requested; retain honest measurement limits |
| Menu logging filter has no clear benefit | A roughly 2% single-run CPU difference did not establish a material gain | Restore the original logging configuration and remove the trial override |
| Settings freezes after a resource overlay | The native UI could not read a root-only resource; an early menu target was also wrong | Use readable resource modes/labels and the actual split menu files |
| About/settings popup retains blue backgrounds | Separate menu/popup resources use their own palette classes | Apply the scoped Graphite palette to the relevant Eet metadata while preserving other entries |
| Original Home appears before the custom bar | A post-display kill/observer reacts too late | Intercept the native show decision before mapping the window |
| Managed Home patch appears ignored | The TV loads a native-image copy | Cover both verified IL and native-image paths; preserve original-code fallback |
| Home remains on screen too long | Idle timeout was longer than requested | Retain a five-second idle hide and check it without additional input |
| Custom controls become ready late after power-on | The remote bridge was launched again when Home became ready | Include Home code 63 in the initial policy and defer background verification |
| Reordered apps revert after a rebuild/restart | Native row import must not overwrite the custom saved list | Treat the protected saved TSV as the authority and test a one-app cold boot |
| Home edit fails from another tab | The page revision is stale | Reject the save and refresh; do not overwrite a newer layout silently |
| Updater loses controller access | Truncating the live allowlist file blocks the next LAN request | Stage and verify a pending file, then rename atomically; recover via the authorized SDB loopback tool if needed |

For recovery commands, use [ROLLBACK.md](ROLLBACK.md). For the final observed configuration, use [START-TO-FINISH.md](START-TO-FINISH.md). Preserve original backups and error output privately rather than pasting tokens or certificates into an issue.
