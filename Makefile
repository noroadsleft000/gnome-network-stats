PACKAGE=network-stats

# should match the uuid in metadata.json
UUID = network-stats@gnome.noroadsleft.xyz

GETTEXT_PACKAGE = $(PACKAGE)

LANGUAGES=en_US nl se_SV
DOC_FILES=README.md TODO.md
SRC_FILES=extension.js prefs.js App.js AppController.js AppSettingsModel.js net/*.js ui/*.js utils/*.js
CONFIG_FILES=stylesheet.css metadata.json
MO_FILES=$(foreach LANGUAGE, $(LANGUAGES), locale/$(LANGUAGE)/LC_MESSAGES/$(GETTEXT_PACKAGE).mo)
SCHEMA_FILES=schemas/org.gnome.shell.extensions.network-stats.gschema.xml
SCHEMA_COMPILED_FILES=schemas/gschemas.compiled
ASSET_FILES=assets/*
OUTPUT=$(DOC_FILES) $(SRC_FILES) $(MO_FILES) $(SCHEMA_FILES) $(SCHEMA_COMPILED_FILES) $(CONFIG_FILES) ${ASSET_FILES}
POT_FILE=locale/$(GETTEXT_PACKAGE).pot
LOCAL_INSTALL=~/.local/share/gnome-shell/extensions/$(UUID)


.PHONY: pack
pack: $(OUTPUT)
	@echo "packaging..."
	zip $(UUID).zip $(OUTPUT)

$(POT_FILE): $(SRC_FILES)
	mkdir -p po
	xgettext -d $(GETTEXT_PACKAGE) -o $@ $(SRC_FILES) --from-code=UTF-8

update-po: $(POT_FILE)
	for lang in $(LANGUAGES); do \
		msgmerge -U po/$$lang.po $(POT_FILE); \
	done

locale/%/LC_MESSAGES/network-stats.mo: locale/%.po
	mkdir -p `dirname $@`
	msgfmt $< -o $@

schemas/gschemas.compiled: $(SCHEMA_FILES)
	@echo "compiling schema..."
	glib-compile-schemas  schemas

.PHONY: build
build: pack
	@echo "building..."

.PHONY: install
install: pack
	@echo "installing..."
	mkdir -p $(LOCAL_INSTALL)
	rm -rf $(LOCAL_INSTALL)
	unzip $(UUID).zip -d $(LOCAL_INSTALL)

.PHONY: uninstall
uninstall:
	@echo "uninstalling..."
	gnome-extensions uninstall $(UUID)

.PHONY: enable
enable:
	@echo "enabling..."
	gnome-extensions enable $(UUID)

.PHONY: disable
disable:
	@echo "disabling..."
	gnome-extensions disable $(UUID)

.PHONY: reset
reset:
	@echo "reloading..."
	gnome-extensions reset $(UUID)

.PHONY: debug
debug: install
	@echo "starting debug session..."
	dbus-run-session -- gnome-shell --nested --wayland

.PHONY: help
help:
	@echo "Command usage : "
	@echo "-------------------------------------------------------"
	@echo "make build           --  build the extension"
	@echo "make install         --  install the extension"
	@echo "make enable          --  enable the extension"
	@echo "make disable         --  disable the extension"
	@echo "make pack            --  package the extension"
	@echo "make debug    	    --  launch nested session to debug the extension"
