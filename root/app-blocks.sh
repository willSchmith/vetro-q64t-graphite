set -e
block_root=/opt/vetro-boot/blocked-apps
[ -f "$block_root/enabled" ] || exit 0
block_mode=${1:-guard}
case "$block_mode" in guard|boot|apply) ;; *) exit 2 ;; esac
block_rows=/run/vetro-blocked-apps-$$.rows
block_contexts=/run/vetro-blocked-apps-$$.contexts
trap 'rm -f "$block_rows" "$block_contexts"' EXIT
block_sql="SELECT app_id||'|'||app_disable FROM package_app_info WHERE package IN ('MCmYXNxgcu','com.samsung.tv.aria-video','30IKH0OX8U','QmpwflxWdt','skysh0WTIM','BEd6UQZYva','FyObqYlHVG') ORDER BY package,app_id;"
sqlite3 -readonly /opt/dbspace/.pkgmgr_parser.db "$block_sql" > "$block_rows"
block_changed=0
while IFS='|' read -r block_app block_state; do
 case "$block_app" in ''|*[!A-Za-z0-9_.-]*|-*|.*) echo INVALID_APP_ENTRY; exit 2 ;; esac
 if [ "$block_state" != true ]; then
  pkgcmd -D -t app -n "$block_app" --global
  app_launcher -k "$block_app" >/dev/null 2>&1 || :
  block_changed=$((block_changed + 1))
 elif [ "$block_mode" != guard ]; then
  app_launcher -k "$block_app" >/dev/null 2>&1 || :
 fi
done < "$block_rows"
sqlite3 -readonly /opt/dbspace/.pkgmgr_parser.db "$block_sql" > "$block_rows"
app_launcher --user 5001 -S > "$block_contexts"
/usr/bin/node -e "$(cat "$block_root/verify-running.js")" "$block_rows" "$block_contexts" "$block_changed"
