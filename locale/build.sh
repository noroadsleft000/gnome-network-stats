find ../ -type f -name "*.js" > POTFILES.in
xgettext \
--omit-header \
--copyright-holder="No roads left" \
--package-name="network-stats" --package-version="1.0" \
--msgid-bugs-address="noroadsleft000@gmail.com" \
--from-code=UTF-8 -d ntwork-stats -o network-stats.pot -p po --keyword=_:1 -f POTFILES.in