#!/usr/bin/env bash
# Trusted hosted-runner wrapper. Fail closed if any isolation control is unavailable.
set -euo pipefail

test "${GITHUB_ACTIONS:-}" = true
test -d node_modules
test -d "${HOME}/.cache/ms-playwright"
test -f /sys/fs/cgroup/cgroup.controllers
test -x /usr/bin/bwrap
test -x /usr/bin/prlimit
test -x /usr/bin/setpriv
node_bin=$(dirname "$(readlink -f "$(command -v node)")")
node_root=$(dirname "${node_bin}")
[[ "${node_root}" == /opt/hostedtoolcache/node/*/x64 ]]
mkdir -p node_modules/.vite-temp node_modules/.vite node_modules/.cache
uid=$(id -u)
gid=$(id -g)
test "${uid}" -ne 0
cgroup="/sys/fs/cgroup/json-flatten-${BASHPID}"
sudo mkdir "${cgroup}"
cleanup() {
  sudo /bin/bash -euo pipefail -c '
    printf "1\n" > "$1/cgroup.kill"
    for attempt in {1..20}; do
      if rmdir "$1" 2>/dev/null; then exit 0; fi
      sleep 0.1
    done
    echo "Isolated cgroup cleanup did not complete" >&2
    exit 1
  ' -- "${cgroup}"
}
trap cleanup EXIT
sudo /bin/bash -euo pipefail -c '
  printf "3221225472\n" > "$1/memory.max"
  printf "0\n" > "$1/memory.swap.max"
  printf "128\n" > "$1/pids.max"
  printf "200000 100000\n" > "$1/cpu.max"
  test "$(cat "$1/memory.max")" = 3221225472
  test "$(cat "$1/memory.swap.max")" = 0
  test "$(cat "$1/pids.max")" = 128
  test "$(cat "$1/cpu.max")" = "200000 100000"
' -- "${cgroup}"
echo "Isolation: no external network; empty allowlisted environment; read-only source/toolchain; 2GiB temporary scratch; 3GiB memory; 128 tasks; two CPUs; 360s process CPU; 128MiB file cap; 480s wall cap."

# Diagnostics are read-only and allowlisted: never dump the environment or a
# general kernel log. An unavailable observation does not change the sandbox.
isolation_diagnostics() {
  printf 'Isolation runner image: %s / %s\n' "${ImageOS:-unavailable}" "${ImageVersion:-unavailable}"
  uname -srv || true
  /usr/bin/bwrap --version || true
  dpkg-query -W -f='${binary:Package}=${Version}\n' bubblewrap apparmor apparmor-profiles 2>/dev/null || true
  stat -Lc 'bwrap mode=%a uid=%u gid=%g size=%s' /usr/bin/bwrap || true
  sha256sum /usr/bin/bwrap || true
  if command -v getcap >/dev/null 2>&1; then
    getcap /usr/bin/bwrap || true
  else
    printf '%s\n' 'bwrap file capabilities: unavailable'
  fi
  printf '%s\n' 'Launcher shell security status (before setpriv; not the sandbox status):'
  grep -E '^(Uid|Gid|CapInh|CapPrm|CapEff|CapBnd|CapAmb|NoNewPrivs|Seccomp|Seccomp_filters):' "/proc/$$/status" || true
  for file in "/proc/$$/attr/current" "/proc/$$/uid_map" "/proc/$$/gid_map" \
    /sys/module/apparmor/parameters/enabled \
    /proc/sys/kernel/unprivileged_userns_clone \
    /proc/sys/kernel/apparmor_restrict_unprivileged_userns \
    /proc/sys/kernel/apparmor_restrict_unprivileged_unconfined \
    /proc/sys/user/max_user_namespaces; do
    printf '%s: ' "${file}"
    if test -r "${file}"; then
      head -n 4 "${file}" || true
      printf '\n'
    else
      printf '%s\n' 'unavailable'
    fi
  done
}

isolation_failure_diagnostics() {
  printf 'Isolation failed after %s UTC; child PID/namespace observations are above when available.\n' "${isolation_started}"
  printf '%s\n' 'Kernel audit not collected: exact child-process audit observation is unavailable.'
}

isolation_diagnostics || true
isolation_started=$(date -u '+%Y-%m-%d %H:%M:%S')

# Root is needed only to join the cgroup. Drop to the checkout owner before
# bwrap maps the caller's host uid; no host permissions need to be changed.
if sudo /bin/bash -euo pipefail -c 'printf "%s\n" "$$" > "$1/cgroup.procs"; grep -qx "$$" "$1/cgroup.procs"; shift; exec "$@"' -- \
  "${cgroup}" /usr/bin/setpriv --reuid "${uid}" --regid "${gid}" --clear-groups --no-new-privs \
  /usr/bin/timeout --signal=KILL 480 \
  /usr/bin/prlimit --cpu=360 --fsize=134217728 --nofile=512 --nproc=128 \
  /usr/bin/bwrap --unshare-all --unshare-user --unshare-cgroup --disable-userns --die-with-parent --new-session \
  --json-status-fd 2 \
  --uid "${uid}" --gid "${gid}" --cap-drop ALL \
  --ro-bind /usr /usr --ro-bind "${node_root}" "${node_root}" \
  --ro-bind /bin /bin --ro-bind /lib /lib --ro-bind /lib64 /lib64 \
  --dir /etc --ro-bind /etc/ld.so.cache /etc/ld.so.cache --ro-bind /etc/fonts /etc/fonts \
  --ro-bind "${PWD}" /source \
  --size 4096 --tmpfs /source/.git --remount-ro /source/.git \
  --ro-bind "${HOME}/.cache/ms-playwright" /browsers \
  --proc /proc --dev /dev --size 2013265920 --tmpfs /scratch --chmod 0777 /scratch \
  --dir /scratch/repo --chmod 0777 /scratch/repo \
  --ro-bind "${PWD}/node_modules" /scratch/repo/node_modules \
  --size 33554432 --tmpfs /scratch/repo/node_modules/.vite-temp --chmod 0777 /scratch/repo/node_modules/.vite-temp \
  --size 67108864 --tmpfs /scratch/repo/node_modules/.vite --chmod 0777 /scratch/repo/node_modules/.vite \
  --size 33554432 --tmpfs /scratch/repo/node_modules/.cache --chmod 0777 /scratch/repo/node_modules/.cache \
  --symlink /scratch/tmp /tmp --chdir /scratch \
  --remount-ro /dev --remount-ro / \
  --clearenv --setenv PATH "${node_bin}:/usr/bin:/bin" \
  --setenv HOME /scratch/home --setenv TMPDIR /scratch/tmp \
  --setenv XDG_CACHE_HOME /scratch/cache --setenv npm_config_cache /scratch/npm-cache \
  --setenv PLAYWRIGHT_BROWSERS_PATH /browsers --setenv CI true \
  --setenv UV_THREADPOOL_SIZE 2 \
  /bin/bash /source/tests/browser/json-flatten/inside-isolated.sh; then
  echo "Isolated Flatten validation exited successfully. No sandbox-generated files are retained."
else
  isolation_status=$?
  isolation_failure_diagnostics || true
  exit "${isolation_status}"
fi
