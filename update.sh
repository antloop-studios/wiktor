#!/bin/bash

find entries/* \
| sed 's/entries\///g' \
| awk '{ print "\""$0"\""}' \
| paste -sd "," - \
| awk '{ print "[" $0 "]" }' \
> wiktor/entries.json
