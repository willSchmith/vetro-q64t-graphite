set -e
mode=${1:-off}
case "$mode" in on|off) ;; *) exit 2 ;; esac
/usr/bin/node -e "$(cat /opt/vetro-boot/graphite-home/renderer/verify.js)"
source=/opt/vetro-boot/graphite-home/renderer/csfs.dll
target=/usr/apps/com.samsung.tv.csfs/bin/csfs.dll
if [ "$mode" = on ]; then
 if [ "$(stat -c %d:%i "$source")" != "$(stat -c %d:%i "$target")" ]; then mount --bind "$source" "$target"; fi
else
 if [ "$(stat -c %d:%i "$source")" = "$(stat -c %d:%i "$target")" ]; then umount "$target" 2>/dev/null || umount -l "$target"; fi
fi
target=/usr/apps/com.samsung.tv.csfs/bin/.native_image/csfs.ni.dll
if [ "$mode" = on ]; then
 if [ "$(stat -c %d:%i "$source")" != "$(stat -c %d:%i "$target")" ]; then mount --bind "$source" "$target"; fi
else
 if [ "$(stat -c %d:%i "$source")" = "$(stat -c %d:%i "$target")" ]; then umount "$target" 2>/dev/null || umount -l "$target"; fi
fi
printf "HOME_REDIRECT_%s\n" "$mode"
