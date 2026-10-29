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

# Distinguish known packaged bwrap policy files from loaded policy names.
# Normal reads only; do not load profiles, change policy, or inspect other logs.
isolation_profile_diagnostics() {
  local profile canonical checksum loaded bytes
  for profile in /etc/apparmor.d/bwrap /etc/apparmor.d/bwrap-userns-restrict \
    /etc/apparmor.d/usr.bin.bwrap /usr/share/apparmor/extra-profiles/bwrap-userns-restrict; do
    printf 'Known bwrap policy file %s: ' "${profile}"
    if ! test -e "${profile}" && ! test -L "${profile}"; then
      printf '%s\n' 'not observed (absent or inaccessible)'
      continue
    fi
    if ! test -f "${profile}" || ! test -r "${profile}"; then
      printf '%s\n' 'present; regular-file read unavailable'
      continue
    fi
    if ! canonical=$(readlink -f -- "${profile}" 2>/dev/null); then
      printf '%s\n' 'present; canonical path unavailable'
      continue
    fi
    case "${canonical}" in
      /etc/apparmor.d/bwrap|/etc/apparmor.d/bwrap-userns-restrict|/etc/apparmor.d/usr.bin.bwrap|/usr/share/apparmor/extra-profiles/bwrap-userns-restrict)
        if ! bytes=$(stat -Lc '%s' -- "${canonical}" 2>/dev/null) || ! [[ "${bytes}" =~ ^[0-9]+$ ]] || ! test "${bytes}" -le 65536; then
          printf '%s\n' 'present; size observation unavailable or above the 64KiB diagnostic bound'
          continue
        fi
        if checksum=$(/usr/bin/timeout 2 sha256sum -- "${canonical}" 2>/dev/null); then
          printf 'readable; sha256=%s\n' "${checksum%% *}"
        else
          printf '%s\n' 'present; checksum read unavailable'
        fi
        ;;
      *) printf '%s\n' 'present; resolved content is outside the allowlist (not read)' ;;
    esac
  done
  printf '%s\n' 'Loaded known bwrap profile names (not the child process label):'
  if ! test -r /sys/kernel/security/apparmor/profiles; then
    printf '%s\n' 'unavailable (normal read not permitted or interface absent)'
    return
  fi
  if loaded=$(/usr/bin/timeout 2 awk '
    $1 == "bwrap" || $1 == "unpriv_bwrap" || $1 == "bwrap//&unpriv_bwrap" || $1 == "/usr/bin/bwrap" {
      if (count++ < 8) {
        if ($2 == "(enforce)" || $2 == "(complain)" || $2 == "(kill)" || $2 == "(unconfined)")
          print $1 " " $2
        else
          print $1 " (mode unavailable)"
      }
    }' /sys/kernel/security/apparmor/profiles 2>/dev/null); then
    if test -n "${loaded}"; then
      printf '%s\n' "${loaded}"
      printf '%s\n' 'Reporting is capped at 8 matching records; additional or differently named relevant policy is not ruled out.'
    else
      printf '%s\n' 'No allowlisted profile name observed; other policy names are not reported, and absence of other relevant policy is not established.'
    fi
  else
    printf '%s\n' 'unavailable (normal profile-list read failed; no retry or privilege change)'
  fi
}

isolation_diagnostics || true
isolation_profile_diagnostics || true
isolation_started=$(date -u '+%Y-%m-%d %H:%M:%S')

# Root is needed only to join the cgroup. Drop to the checkout owner before
# bwrap maps the caller's host uid; no host permissions need to be changed.
# Duplicate stderr in this existing trusted shell, after sudo has closed inherited
# descriptors. bwrap owns/closes its status descriptor in the sandbox child;
# using descriptor 2 directly would hide the original setup/product errors.
if sudo /bin/bash -euo pipefail -c 'printf "%s\n" "$$" > "$1/cgroup.procs"; grep -qx "$$" "$1/cgroup.procs"; shift; exec 3>&2; exec "$@"' -- \
  "${cgroup}" /usr/bin/setpriv --reuid "${uid}" --regid "${gid}" --clear-groups --no-new-privs \
  /usr/bin/timeout --signal=KILL 480 \
  /usr/bin/prlimit --cpu=360 --fsize=134217728 --nofile=512 --nproc=128 \
  /usr/bin/bwrap --unshare-all --unshare-user --unshare-cgroup --disable-userns --die-with-parent --new-session \
  --json-status-fd 3 \
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
