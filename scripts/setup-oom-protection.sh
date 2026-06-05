#!/bin/bash

# OOM Protection Setup for WSL
# Run with: sudo bash scripts/setup-oom-protection.sh

set -e

echo "Setting up OOM protection..."

# Install earlyoom if available
if command -v apt-get &> /dev/null; then
    echo "Installing earlyoom..."
    apt-get update && apt-get install -y earlyoom || echo "earlyoom not available in repos"
    
    # Enable earlyoom service
    if command -v systemctl &> /dev/null; then
        systemctl enable earlyoom 2>/dev/null || true
        systemctl start earlyoom 2>/dev/null || true
    fi
fi

# Create memory limit wrapper
cat > /usr/local/bin/memory-limited <<'EOF'
#!/bin/bash

# Memory-limited command wrapper
# Usage: memory-limited <soft_limit_mb> <hard_limit_mb> <command...>

SOFT_LIMIT=${1:-2048}
HARD_LIMIT=${3:-3072}
shift 2

# Convert to bytes
SOFT_BYTES=$((SOFT_LIMIT * 1024 * 1024))
HARD_BYTES=$((HARD_LIMIT * 1024 * 1024))

# Run with memory limits using ulimit
ulimit -v $((HARD_BYTES / 1024)) 2>/dev/null || true
exec "$@"
EOF

chmod +x /usr/local/bin/memory-limited 2>/dev/null || echo "Could not create /usr/local/bin/memory-limited (run as root)"

# Set up cgroup memory limits if cgroups v2 is available
if [ -f /sys/fs/cgroup/cgroup.controllers ]; then
    echo "Cgroups v2 detected, setting up memory limits..."
    
    # Create a cgroup for development processes
    mkdir -p /sys/fs/cgroup/dev-tools
    
    # Set 8GB memory limit for dev tools (leaves room for system)
    echo "8589934592" > /sys/fs/cgroup/dev-tools/memory.max 2>/dev/null || true
    
    echo "To run with limits: echo \$\$ > /sys/fs/cgroup/dev-tools/cgroup.procs && <command>"
fi

echo ""
echo "OOM protection setup complete!"
echo ""
echo "Recommended: Use the memory-safe scripts instead of direct commands:"
echo "  pnpm lint          # Sequential, memory-safe"
echo "  pnpm type-check    # Sequential, memory-safe"
echo "  pnpm memory-check  # Check available memory"
