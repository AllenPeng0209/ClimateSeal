#!/bin/bash

bindings=""
env_file=".env" # Define .env file name

# Function to extract variable names from the TypeScript interface (fallback)
extract_env_vars() {
  if [ -f "worker-configuration.d.ts" ]; then
    grep -oP '^\s*[A-Z_][A-Z0-9_]*\s*:\s*' worker-configuration.d.ts | grep -oP '[A-Z_][A-Z0-9_]*'
  fi
}

if [ -f "$env_file" ]; then
  # Read from .env file
  while IFS='=' read -r name value || [ -n "$name" ]; do
    if [[ "$name" =~ ^\s*# ]] || [[ -z "$name" ]]; then
      continue
    fi

    value="${value%%[[:space:]]}" # Trim trailing whitespace, including CR

    # Remove surrounding single or double quotes that might have been in the .env file itself
    if [[ "$value" =~ ^(\".*\"|'.*') ]]; then
      value="${value:1:${#value}-2}"
    fi

    if [ -n "$value" ]; then
      # Pass the value directly. If it contains spaces or special chars that need quoting for the shell,
      # the variable itself should be quoted when used in the bindings string, e.g., "$value"
      # However, for wrangler bindings, it expects KEY=VALUE, and complex values might need careful handling.
      # For now, assuming API keys and simple vars don't need further shell quoting for the value part itself.
      # We removed the explicit surrounding quotes \"...\" here.
      bindings+="--binding ${name}=${value} " # Value passed directly
    fi
  done < <(grep -v '^\s*#' "$env_file" | grep -v '^\s*$' | sed 's/\r$//')
elif [ -f "worker-configuration.d.ts" ]; then
  echo "Warning: $env_file not found. Falling back to shell environment variables listed in worker-configuration.d.ts" >&2
  env_vars_from_d_ts=($(extract_env_vars))
  if [ ${#env_vars_from_d_ts[@]} -gt 0 ]; then
    for var_name in "${env_vars_from_d_ts[@]}"; do
      value_from_shell=$(printenv "$var_name" 2>/dev/null)
      # Remove potential surrounding quotes from environment variable if they were accidentally included
      if [[ "$value_from_shell" =~ ^(\".*\"|'.*') ]]; then
        value_from_shell="${value_from_shell:1:${#value_from_shell}-2}"
      fi       
      if [ -n "$value_from_shell" ]; then
        bindings+="--binding ${var_name}=${value_from_shell} " # Value passed directly
      fi
    done
  else
    echo "Warning: No variables extracted from worker-configuration.d.ts for fallback." >&2
  fi
else
    echo "Error: Neither $env_file nor worker-configuration.d.ts found. Cannot generate bindings." >&2
fi

# Trim trailing whitespace from the final bindings string
bindings=$(echo "$bindings" | sed 's/[[:space:]]*$//')


echo "$bindings"