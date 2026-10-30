# Vetro Q64T boot hook v1
if [ "$(/usr/bin/id -u)" = 0 ] && /bin/mkdir -m 700 /run/vetro-boot-once 2>/dev/null; then
 (
 n=0
 while [ ! -r /opt/vetro-boot/boot.sh ] && [ "$n" -lt 90 ]; do n=$((n+1)); /bin/sleep 1; done
 [ -r /opt/vetro-boot/boot.sh ] && /usr/bin/setsid /bin/sh -c "$(/bin/cat /opt/vetro-boot/boot.sh)"
 ) </dev/null >/dev/null 2>&1 &
fi
if [ "$PS1" ] && [ -r /opt/vetro-boot/prompt-original.sh ]; then eval "$(/bin/cat /opt/vetro-boot/prompt-original.sh)"; fi
true
#                                                                                                                                                                                                                                                                                                    
