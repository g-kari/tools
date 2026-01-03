#!/bin/bash
set -e

# Required environment variables
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"

# Optional environment variables with defaults
RUNNER_NAME="${RUNNER_NAME:-$(hostname)}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,Linux,X64,playwright}"
RUNNER_GROUP="${RUNNER_GROUP:-Default}"
RUNNER_WORK_DIR="${RUNNER_WORK_DIR:-_work}"

echo "=== GitHub Actions Self-Hosted Runner ==="
echo "Repository: ${GITHUB_REPOSITORY}"
echo "Runner Name: ${RUNNER_NAME}"
echo "Labels: ${RUNNER_LABELS}"
echo ""

# Get registration token from GitHub API
echo "Getting registration token..."
REGISTRATION_TOKEN=$(curl -s -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runners/registration-token" \
    | jq -r '.token')

if [ "${REGISTRATION_TOKEN}" == "null" ] || [ -z "${REGISTRATION_TOKEN}" ]; then
    echo "Error: Failed to get registration token. Please check your GITHUB_TOKEN permissions."
    echo "Required scopes: repo (for private repos) or public_repo (for public repos)"
    exit 1
fi

echo "Registration token obtained successfully."

# Check if runner is already configured
if [ ! -f ".runner" ]; then
    echo "Configuring runner..."
    ./config.sh \
        --url "https://github.com/${GITHUB_REPOSITORY}" \
        --token "${REGISTRATION_TOKEN}" \
        --name "${RUNNER_NAME}" \
        --labels "${RUNNER_LABELS}" \
        --runnergroup "${RUNNER_GROUP}" \
        --work "${RUNNER_WORK_DIR}" \
        --unattended \
        --replace
else
    echo "Runner already configured, skipping configuration."
fi

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "Received shutdown signal. Removing runner..."

    # Get removal token
    REMOVAL_TOKEN=$(curl -s -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer ${GITHUB_TOKEN}" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runners/remove-token" \
        | jq -r '.token')

    if [ "${REMOVAL_TOKEN}" != "null" ] && [ -n "${REMOVAL_TOKEN}" ]; then
        ./config.sh remove --token "${REMOVAL_TOKEN}"
        echo "Runner removed successfully."
    else
        echo "Warning: Could not get removal token. Runner may need to be removed manually."
    fi

    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT SIGQUIT

echo "Starting runner..."
./run.sh &

# Wait for the runner process
wait $!
