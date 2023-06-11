#!/bin/bash
#set -e
#set -x

help()
{
    echo "Command usage : "
    echo "-------------------------------------------------------"
    echo "./commands.sh build           --  build the extension"
    echo "./commands.sh install         --  install the extension"
    echo "./commands.sh enable          --  enable the extension"
    echo "./commands.sh disable         --  disable the extension"
    echo "./commands.sh pack            --  package the extension"
    echo "./commands.sh launch_debug    --  launch nested session to debug the extension"
}

build()
{
    echo "building..."
    msgfmt locale/*.po --output-file=*.mo
    glib-compile-schemas schemas
}

install()
{
    build
    pack
    echo "installing..."
    gnome-extensions install --force network-stats@gnome.noroadsleft.xyz.shell-extension.zip
    enable
}

uninstall()
{
    disable
    echo "uninstalling..."
    gnome-extensions uninstall network-stats@gnome.noroadsleft.xyz
}

enable()
{
    echo "enabling..."
    gnome-extensions enable network-stats@gnome.noroadsleft.xyz
}

disable()
{
    echo "disabling..."
    gnome-extensions disable network-stats@gnome.noroadsleft.xyz
}

pack()
{
    echo "packaging..."
    gnome-extensions pack \
    --out-dir . \
    --force \
    --extra-source=App.js \
    --extra-source=AppController.js \
    --extra-source=AppSettingsModel.js \
    --extra-source=AUTHORS \
    --extra-source=README.md \
    --extra-source=LICENSE \
    --extra-source=assets \
    --extra-source=net \
    --extra-source=ui \
    --extra-source=utils \
    --podir=locale
}

debug()
{
    echo "launching for debug..."
    install
    dbus-run-session -- gnome-shell --nested --wayland
}


if [ "$1" = "build" ]; then
    build
elif [ "$1" = "install" ]; then
    install
elif [ "$1" = "uninstall" ]; then
    uninstall
elif [ "$1" = "enable" ]; then
    enable
elif [ "$1" = "enable" ]; then
    disable
elif [ "$1" = "pack" ]; then
    pack
elif [ "$1" = "debug" ]; then
    debug
else
    help
fi