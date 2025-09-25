#!/bin/bash

find ../ -type f -name "*.ts" -not -path "*/node_modules/*" > POTFILES.in
xgettext \
--copyright-holder="No roads left" \
--package-name="network-stats" \
--package-version="1.0" \
--msgid-bugs-address="noroadsleft000@gmail.com" \
--copyright-holder="`date +%Y` No roads left" \
--no-location \
--language=Python \
--from-code=UTF-8 -d network-stats -o network-stats.pot -p . --keyword=_:1 -f POTFILES.in

# use bellow command to generate a laguage specific po file.
#msginit --locale=en_GB -o en_GB.po
