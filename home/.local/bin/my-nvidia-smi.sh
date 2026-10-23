#!/bin/bash
INTERVAL="${1:-5}"

watch -n "$INTERVAL" 'echo "=================== THERMAL ZONES ==================="
for zone in /sys/class/thermal/thermal_zone*; do
    type=$(cat "$zone/type" 2>/dev/null)
    # skip noisy/irrelevant zones by name pattern
    case "$type" in
        acpitz|INT3400*|SEN*|B0D4) continue ;;
    esac
    temp_raw=$(cat "$zone/temp" 2>/dev/null)
    if [[ "$temp_raw" =~ ^[0-9]+$ ]]; then
        temp_c="$((temp_raw / 1000))°C"
    else
        temp_c="N/A"
    fi
    printf "%-20s %s\n" "$type" "$temp_c"
done

nvidia_temp=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>/dev/null || echo "OFF")
printf "%-20s %s°C\n" "NVIDIA:" "$nvidia_temp"

echo "=================== HWMON SENSORS ===================="
for i in /sys/class/hwmon/hwmon*/temp*_input; do
    hw_dir=$(dirname "$i")
    dev_name=$(cat "$hw_dir/name" 2>/dev/null)
    # skip noisy/irrelevant devices by name pattern
    case "$dev_name" in
        acpitz_*|iwlwifi_*) continue ;;
    esac
    label=$(cat "${i%_*}_label" 2>/dev/null || basename "${i%_*}")
    temp_raw=$(cat "$i" 2>/dev/null)
    if [[ "$temp_raw" =~ ^[0-9]+$ ]]; then
        temp_c=$(echo "scale=1; $temp_raw / 1000" | bc 2>/dev/null || echo "$((temp_raw / 1000))")
        temp_c="${temp_c}°C"
    else
        temp_c="N/A"
    fi
    printf "%-12s %-15s %s\n" "$dev_name" "$label" "$temp_c"
done

echo "=================== MEMORY USAGE ====================="
free -h

nvidia-smi
'
