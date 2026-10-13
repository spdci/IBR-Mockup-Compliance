#!/bin/sh
exec mockoon-cli start \
  --hostname 0.0.0.0 0.0.0.0 \
  --data mockoon-ibr.json mockoon-sp.json \
  --disable-log-to-file
