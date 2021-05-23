#!/bin/bash
#set -e
#set -x

help()
{
    echo "./commands.sh build           --  build the extension"
    echo "./commands.sh install         --  install the extension"
    echo "./commands.sh enable          --  enable the extension"
    echo "./commands.sh disable         --  disable the extension"
    echo "./commands.sh pack            --  package the extension"
}

build()
{
    #msgfmt *.po --output-file=*.mo
    glib-compile-schemas schemas
}

install()
{
    EXTENSION_DIR=~/.local/share/gnome-shell/extensions/network-stats@gnome.noroadsleft.xyz
    mkdir -p ${EXTENSION_DIR}
    cp -r * ${EXTENSION_DIR}
    enable
}

enable()
{
    gnome-extensions enable network-stats@gnome.noroadsleft.xyz
}

disable()
{
    gnome-extensions disable network-stats@gnome.noroadsleft.xyz
}

pack()
{
    gnome-extensions pack
}


if [ "$1" = "build" ]; then
    build
elif [ "$1" = "install" ]; then
    install
elif [ "$1" = "enable" ]; then
    enable
elif [ "$1" = "enable" ]; then
    disable
elif [ "$1" = "pack" ]; then
    pack
else
    help
fi