#!/bin/bash

find entries/* \
| sed 's/entries\///' \
| sed '/index.json/d' \
| awk '{ print "\""$0"\""}' \
| paste -sd "," - \
| awk '{ print "[\n\t" $0 "\n]\n" }' \
| sed 's/,/,\n\t/g' \
> entries/index.json
