#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p build
mcs -target:exe -out:app/native/dock/tvlauncher-dotnet.dll $(find dock/src -name '*.cs' -print)
mcs -target:exe -out:app/native-helper/VetroRemoteInput.dll app/native-helper/VetroRemoteInput.cs
mcs -out:build/ThemeImageTool.dll tools/ThemeImageTool.cs
cecil=$(find /usr/lib/mono/gac/Mono.Cecil -path '*0.11*' -name Mono.Cecil.dll | head -n 1)
[ -n "$cecil" ] || { echo 'Install libmono-cecil-private-cil' >&2; exit 1; }
mcs -r:"$cecil" -out:build/PatchHome.exe tools/PatchHome.cs
cp "$cecil" build/Mono.Cecil.dll
node --check app/service/main.js
printf 'Managed helpers built.\n'
