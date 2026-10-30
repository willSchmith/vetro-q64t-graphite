cd /run/vetro-q64t || exit 1
umask 077
if ! test -p queue/wake; then
 rm -f queue/wake
 mkfifo -m 600 queue/wake || exit 1
fi
# Open both ends so the reader stays alive between short-lived writers.
exec 9<>queue/wake || exit 1
while test -f active; do
 for f in queue/*.ready; do
  test -f "$f" || continue
  p=${f%.ready}
  cmd=$(cat "$f")
  seconds=$(cat "$p.seconds")
  /usr/bin/setsid /bin/bash -c "$cmd" >"$p.out" 2>"$p.err" 9>&- &
  task=$!
  (sleep "$seconds"; kill -TERM -- -"$task" 2>/dev/null) 9>&- & timer=$!
  wait "$task"; rc=$?
  kill "$timer" 2>/dev/null; wait "$timer" 2>/dev/null
  rm -f "$f"
  printf '%s' "$rc" >"$p.result"; mv "$p.result" "$p.done"
 done
 # A notification wakes the worker immediately; the timeout is a recovery path.
 IFS= read -r -n 1 -t 1 <&9 || :
done
