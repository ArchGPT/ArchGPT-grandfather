#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug() {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "archgpt (debug) - $1"
    fi
  }

  readonly hook_name="${0##*/}"
  debug "starting $hook_name..."

  if [ "$ARCHYGPT" = "0" ]; then
    debug "ARCHYGPT env variable is set to 0, skipping hook"
    exit 0
  fi

  for file in "${XDG_CONFIG_HOME:-$HOME/.config}/archgpt/init.sh" "$HOME/.huskyrc.sh"; do
    if [ -f "$file" ]; then
      debug "sourcing $file"
      . "$file"
      break
    fi
  done

  readonly husky_skip_init=1
  export husky_skip_init

  if [ "${SHELL##*/}" = "zsh" ]; then
    zsh --emulate sh -e "$0" "$@"
  else
    sh -e "$0" "$@"
  fi
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    echo "archgpt - $hook_name hook exited with code $exitCode (error)"
  fi

  if [ $exitCode = 127 ]; then
    echo "archgpt - command not found in PATH=$PATH"
  fi

  exit $exitCode
fi
