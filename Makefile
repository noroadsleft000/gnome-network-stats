PACKAGE=network-stats

# should match the uuid in metadata.json
UUID = network-stats@gnome.noroadsleft.xyz

GETTEXT_PACKAGE = $(PACKAGE)

LANGUAGES=en_US nl se_SV ru
DOC_FILES=README.md docs/TODO.md
SRC_FILES= extension.ts prefs.ts $(shell find lib -name "*.ts" 2>/dev/null)
DIST_FILES=dist/extension.js dist/prefs.js $(shell find dist/lib -name "*.js" 2>/dev/null) AUTHORS LICENSE
CONFIG_FILES=stylesheet.css metadata.json
MO_FILES=$(foreach LANGUAGE, $(LANGUAGES), locale/$(LANGUAGE)/LC_MESSAGES/$(GETTEXT_PACKAGE).mo)
SCHEMA_FILES=schemas/org.gnome.shell.extensions.network-stats.gschema.xml
SCHEMA_COMPILED_FILES=schemas/gschemas.compiled
ASSET_FILES=assets/*
OUTPUT=$(DOC_FILES) $(DIST_FILES) $(MO_FILES) $(SCHEMA_FILES) $(SCHEMA_COMPILED_FILES) $(CONFIG_FILES) ${ASSET_FILES}
POT_FILE=locale/$(GETTEXT_PACKAGE).pot
LOCAL_INSTALL=~/.local/share/gnome-shell/extensions/$(UUID)

# Files to include from project root in the zip
EXTRA_FILES=AUTHORS LICENSE metadata.json stylesheet.css

node_modules: package.json
	pnpm install

dist/extension.js dist/prefs.js: node_modules $(SRC_FILES)
	npx tsc

.PHONY: pack
pack: $(OUTPUT)
	@echo "packaging..."
	# copy assets
	@cp -r assets dist/
	
	# copy compiled language files.
	@for mo_file in $(MO_FILES); do \
		mkdir -p dist/$$(dirname $$mo_file); \
		cp $$mo_file dist/$$mo_file; \
	done
	
	# copy compiled schema
	@mkdir -p dist/schemas
	@cp -r ${SCHEMA_COMPILED_FILES} dist/schemas
	
	# Copy selective root files to dist/
	@for file in $(EXTRA_FILES); do \
		if [ -f "$$file" ]; then \
			echo "copying file... $$file"; \
			cp "$$file" dist/; \
		elif [ -d "$$file" ]; then \
			echo "copying directory... $$file"; \
			cp -r "$$file" dist/; \
		else \
			echo "Warning: $$file not found"; \
		fi; \
	done
	@# Create zip from dist directory contents
	@cd dist && zip -r ../$(UUID).zip -9r . -x "*.ts" "node_modules/*"

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

clean:
	@echo "cleaning..."
	rm -rf ./dist
	rm -rf network-stats@gnome.noroadsleft.xyz.zip

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
