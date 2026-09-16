#!/bin/sh
set -e

# node_modules is pre-installed at /opt/deps/node_modules (see Dockerfile.agent)
# instead of /workspace/node_modules, because /workspace is a runtime bind
# mount of the actual project checkout -- anything baked into /workspace at
# build time, node_modules included, is completely shadowed the instant that
# mount takes effect. But nothing then links /opt/deps/node_modules back into
# /workspace, so npm/npx/node module resolution starting from a file under
# /workspace never finds it: a dev_environment_verifier run confirmed `npm
# test` failing with "playwright: Permission denied" -- npx couldn't find a
# local playwright install and fell back to an on-the-fly download attempt,
# which then hit a filesystem permission error.
#
# The fix has to happen here, at container start after the bind mount is
# already live, for the same reason the real directory can't be baked into
# the image at /workspace: a symlink baked at that path would be shadowed by
# the mount exactly like a real directory would be. Guarded on absence so a
# checkout that genuinely has its own /workspace/node_modules (e.g. local
# dev/debugging) is never clobbered.
if [ ! -e /workspace/node_modules ]; then
    ln -s /opt/deps/node_modules /workspace/node_modules
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"
