set -e
theme_base=/opt/vetro-boot/graphite-home
theme_mode=${1:-samsung}
case "$theme_mode" in graphite|samsung) ;; *) exit 2 ;; esac
/usr/bin/node -e "$(cat "$theme_base/verify.js")" "$theme_mode"
theme_created=
trap 'for theme_undo in $theme_created; do umount "$theme_undo" 2>/dev/null || :; done' EXIT
theme_source=/opt/vetro-boot/graphite-home/app_custom_colortable.json
theme_target=/usr/apps/com.samsung.tv.theme-resource/shared/res/PRINCIPLE/COLOR_TABLE/app_custom_colortable.json
theme_owns=$(/usr/bin/stat -c '%d:%i' "$theme_source")
theme_current=$(/usr/bin/stat -c '%d:%i' "$theme_target")
if [ "$theme_mode" = graphite ]; then
 if [ "$theme_current" != "$theme_owns" ]; then
  mount --bind "$theme_source" "$theme_target"
  theme_created="$theme_target $theme_created"
 fi
else
 if [ "$theme_current" = "$theme_owns" ]; then umount "$theme_target" 2>/dev/null || umount -l "$theme_target"; fi
fi
theme_source=/opt/vetro-boot/graphite-home/principle_colortable.json
theme_target=/usr/apps/com.samsung.tv.theme-resource/shared/res/PRINCIPLE/COLOR_TABLE/principle_colortable.json
theme_owns=$(/usr/bin/stat -c '%d:%i' "$theme_source")
theme_current=$(/usr/bin/stat -c '%d:%i' "$theme_target")
if [ "$theme_mode" = graphite ]; then
 if [ "$theme_current" != "$theme_owns" ]; then
  mount --bind "$theme_source" "$theme_target"
  theme_created="$theme_target $theme_created"
 fi
else
 if [ "$theme_current" = "$theme_owns" ]; then umount "$theme_target" 2>/dev/null || umount -l "$theme_target"; fi
fi
theme_source=/opt/vetro-boot/graphite-home/menu.edj
theme_target=/usr/apps/com.samsung.tv.theme-resource/shared/res/org.tizen.menu/edje/menu.edj
theme_owns=$(/usr/bin/stat -c '%d:%i' "$theme_source")
theme_current=$(/usr/bin/stat -c '%d:%i' "$theme_target")
if [ "$theme_mode" = graphite ]; then
 if [ "$theme_current" != "$theme_owns" ]; then
  mount --bind "$theme_source" "$theme_target"
  theme_created="$theme_target $theme_created"
 fi
else
 if [ "$theme_current" = "$theme_owns" ]; then umount "$theme_target" 2>/dev/null || umount -l "$theme_target"; fi
fi
theme_source=/opt/vetro-boot/graphite-home/setting_bg_base.png
theme_target=/usr/apps/com.samsung.tv.theme-resource/shared/res/org.tizen.menu/Settings/setting_bg_base.png
theme_owns=$(/usr/bin/stat -c '%d:%i' "$theme_source")
theme_current=$(/usr/bin/stat -c '%d:%i' "$theme_target")
if [ "$theme_mode" = graphite ]; then
 if [ "$theme_current" != "$theme_owns" ]; then
  mount --bind "$theme_source" "$theme_target"
  theme_created="$theme_target $theme_created"
 fi
else
 if [ "$theme_current" = "$theme_owns" ]; then umount "$theme_target" 2>/dev/null || umount -l "$theme_target"; fi
fi
theme_source=/opt/vetro-boot/graphite-home/mainmenu.json
theme_target=/usr/apps/settings-datafw/res/jsons/tv/mainmenu.json
theme_owns=$(/usr/bin/stat -c '%d:%i' "$theme_source")
theme_current=$(/usr/bin/stat -c '%d:%i' "$theme_target")
if [ "$theme_mode" = graphite ]; then
 if [ "$theme_current" != "$theme_owns" ]; then
  mount --bind "$theme_source" "$theme_target"
  theme_created="$theme_target $theme_created"
 fi
else
 if [ "$theme_current" = "$theme_owns" ]; then umount "$theme_target" 2>/dev/null || umount -l "$theme_target"; fi
fi
theme_source=/opt/vetro-boot/graphite-home/system.json
theme_target=/usr/apps/settings-datafw/res/jsons/tv/system.json
theme_owns=$(/usr/bin/stat -c '%d:%i' "$theme_source")
theme_current=$(/usr/bin/stat -c '%d:%i' "$theme_target")
if [ "$theme_mode" = graphite ]; then
 if [ "$theme_current" != "$theme_owns" ]; then
  mount --bind "$theme_source" "$theme_target"
  theme_created="$theme_target $theme_created"
 fi
else
 if [ "$theme_current" = "$theme_owns" ]; then umount "$theme_target" 2>/dev/null || umount -l "$theme_target"; fi
fi
theme_source=/opt/vetro-boot/graphite-home/menu-theme.edj
theme_target=/usr/apps/com.samsung.tv.theme-resource/shared/res/org.tizen.menu/edje/menu-theme.edj
theme_owns=$(/usr/bin/stat -c '%d:%i' "$theme_source")
theme_current=$(/usr/bin/stat -c '%d:%i' "$theme_target")
if [ "$theme_mode" = graphite ]; then
 if [ "$theme_current" != "$theme_owns" ]; then
  mount --bind "$theme_source" "$theme_target"
  theme_created="$theme_target $theme_created"
 fi
else
 if [ "$theme_current" = "$theme_owns" ]; then umount "$theme_target" 2>/dev/null || umount -l "$theme_target"; fi
fi
theme_source=/opt/vetro-boot/graphite-home/support.edj
theme_target=/usr/apps/com.samsung.tv.theme-resource/shared/res/org.tizen.menu/edje/support.edj
theme_owns=$(/usr/bin/stat -c '%d:%i' "$theme_source")
theme_current=$(/usr/bin/stat -c '%d:%i' "$theme_target")
if [ "$theme_mode" = graphite ]; then
 if [ "$theme_current" != "$theme_owns" ]; then
  mount --bind "$theme_source" "$theme_target"
  theme_created="$theme_target $theme_created"
 fi
else
 if [ "$theme_current" = "$theme_owns" ]; then umount "$theme_target" 2>/dev/null || umount -l "$theme_target"; fi
fi
trap - EXIT
printf "THEME_RESOURCES_%s\n" "$theme_mode"
