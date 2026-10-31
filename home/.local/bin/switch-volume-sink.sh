#!/usr/bin/env bash

# Get the ID of the current default audio sink
DEFAULT_ID=$(wpctl inspect @DEFAULT_AUDIO_SINK@ 2>/dev/null | awk 'NR==1 {sub(/,/,"",$2); print $2}')

# Query PipeWire graph to extract real sinks and their selectable output routes
NEXT_TARGET=$(pw-dump | jq --argjson def_id "${DEFAULT_ID:-0}" -r '
  ([ .[] | select(.type == "PipeWire:Interface:Device") | {
      key: (.id | tostring),
      value: {
        routes: [ .info.params.EnumRoute[]? | select(.direction == "Output") ],
        active_route_index: ([ .info.params.Route[]? | select(.direction == "Output") | .index ] | first)
      }
    } ] | from_entries) as $devs
  |
  [ .[] | select(.info.props["media.class"] == "Audio/Sink" and .info.props["node.virtual"] != true) |
      .id as $sink_id |
      .info.props["node.name"] as $node_name |
      .info.props["node.description"] as $desc |
      .info.props["card.profile.device"] as $dev_card_idx |
      ($sink_id == $def_id) as $is_default_sink |
      ($devs[(.info.props["device.id"] // -1) | tostring]) as $dev |
      ( [ $dev.routes[]? | select(.devices[]? == $dev_card_idx) ] ) as $avail_routes |
      if ($avail_routes | length) > 1 then
        # Multi-route sink (e.g. Built-in Speakers vs Headphones)
        $avail_routes[] | {
          sink_id: $sink_id,
          route_index: .index,
          name: .description,
          icon: (if .name == "analog-output-headphones" then "audio-headphones" else "audio-speakers" end),
          is_active: ($is_default_sink and ($dev.active_route_index == .index))
        }
      else
        # Single output sink (e.g. Bluetooth, HDMI, USB DAC)
        {
          sink_id: $sink_id,
          route_index: "none",
          name: $desc,
          icon: (if ($node_name | startswith("bluez")) then "bluetooth" elif ($node_name | contains("hdmi")) then "video-display" else "audio-speakers" end),
          is_active: $is_default_sink
        }
      end
  ] as $targets
  |
  if ($targets | length) == 0 then
    empty
  else
    ( [ $targets | to_entries[] | select(.value.is_active) | .key ] | first // -1 ) as $cur_idx
    |
    ( ($cur_idx + 1) % ($targets | length) ) as $next_idx
    |
    $targets[$next_idx]
    | "\(.sink_id)\t\(.route_index)\t\(.name)\t\(.icon)"
  end
')

[[ -z "$NEXT_TARGET" ]] && exit 1

IFS=$'\t' read -r NEXT_SINK_ID NEXT_ROUTE NEXT_NAME NEXT_ICON <<< "$NEXT_TARGET"

# Set next sink as default (PipeWire WirePlumber automatically migrates active streams)
wpctl set-default "$NEXT_SINK_ID"

# If the sink has multiple routes (e.g. Speakers vs Headphones), switch route
if [[ "$NEXT_ROUTE" != "none" ]]; then
    wpctl set-route "$NEXT_SINK_ID" "$NEXT_ROUTE"
fi

# Notify user
notify-send -a "System" "Audio output" "$NEXT_NAME" -i "$NEXT_ICON" \
    -r "558" -u low -h string:x-canonical-private-synchronous:audio-sink
