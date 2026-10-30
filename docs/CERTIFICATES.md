# Tizen Studio, Samsung certificates and signed packages

Certificate setup is a separate installation stage. A signing certificate permits application installation on its registered target; it does not grant root. The protected root port and the signed Vetro widget are separate components.

## 1. Complete the SDK installation

1. Open the Package Manager belonging to the Tizen Studio installation you actually use.
2. Check the baseline tools, including Certificate Manager.
3. Under Extension SDK, install the TV extension tools and Samsung Certificate Extension.
4. Restart the tools after installation and check that Certificate Manager opens.

The original workstation displayed an error equivalent to “Certificate Manager is not installed or the path is wrong.” The manager installation/path was repaired before creating the signing profile. Do not solve this by copying another person's certificate or by publishing a `.p12` file. SDK and extension versions can differ from the versions used on this workstation. See Samsung's [SDK setup](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html).

## 2. Connect the intended TV

On the TV, open Apps/App Settings, enter `12345`, enable Developer Mode and set the developer PC address. Restart as requested. In Device Manager, add the TV's address and connect it. Verify the reported model. Samsung documents the [device connection flow](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html).

With the shell variables from INSTALL.md:

```bash
"$SDB" connect "$TV_IP:26101"
"$SDB" devices
```

Ordinary SDB shell access was unavailable on this TV. A successful connection did not imply arbitrary shell commands or root access. SDB still supported the SDK staging directory, installation and launching signed apps.

## 3. Create the Samsung signing profile

1. Open Certificate Manager and create a **Samsung** profile for a **TV** target.
2. Name the profile `vetro` if you want to use the commands below unchanged.
3. Create or select the author certificate and complete the Samsung account steps.
4. Create the distributor certificate and include the connected TV's actual DUID.
5. Check an automatically populated DUID against the connected target before finishing.
6. Save the profile and keep its certificate files and passwords private.

The successful workstation profile was named `vetro`. The actual DUID, certificate passwords and signing material are intentionally absent from the publication. A DUID is a device identifier, not an SMB password, API token or certificate profile name. Samsung's [certificate guide](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html) describes author/distributor certificates and device registration.

## 4. Sign and install a widget when needed

The source snapshot's protected root service does not require redistributing a TV-specific signed WGT. If you also use the upstream Vetro widget, build its web project using that source version's build instructions. Then sign the resulting unsigned WGT with your own profile:

```bash
export TIZEN="$HOME/tizen-studio/tools/ide/bin/tizen"
"$TIZEN" package -t wgt -s vetro -- /path/to/unsigned-vetro.wgt
```

Use the output path printed by the tool. Place the package in a directory with a simple filename such as `vetro.wgt`, then install and launch the app ID declared by its `config.xml`:

```bash
"$TIZEN" install -s "$TV_IP:26101" -n vetro.wgt -- /path/to/package-directory
"$TIZEN" run -s "$TV_IP:26101" -p vetrotvapp.app
```

For the upstream widget used during this project, the background service ID was `vetrotvapp.svc`:

```bash
"$TIZEN" run -s "$TV_IP:26101" -p vetrotvapp.svc
```

These IDs apply to that package, not every third-party widget. Read `config.xml` rather than guessing them. The project encountered an installation failure with a spaced package filename; retrying the same signed package with a simple filename succeeded. Avoid spaces when troubleshooting this SDK/TV combination.

## 5. Distinguish the installed layers

| Layer | What it provides | What it does not establish |
| --- | --- | --- |
| Developer Mode and SDB | Target connection and supported development operations | Root or an unrestricted shell |
| Samsung author/distributor profile | Signing and target-authorized installation | A privilege escalation |
| Signed Vetro widget | TV app/probe and its declared background service | Automatic UID 0 |
| Root Vetro port | Root worker, dashboard, native helper supervision | Persistence before the boot hook is installed |
| Verified boot hook | Starts the protected root port after a full restart | Compatibility with another firmware |

Do not publish the signed WGT, certificates, passwords or DUID as prerequisites for readers. Each reader supplies their own signing identity and target registration.
