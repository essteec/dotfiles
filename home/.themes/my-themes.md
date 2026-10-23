# This folder has these themes

- Material-Black-Plum-BE*
- Orchis-Purple-Dark
- Orchis-Purple-Dark-Compact
- Orchis-Purple-Light
- Sweet-Dark-v40

## Kvantum

put themes below to .config/kvantum

- Edna
- Fluent
- Fluent-dark
- Fluent-light
- Fluent-pink-dark
- Fluent-purple
- Fluent-purple-dark*
- kvantum.kvconfig
- Orchis

## Gtk files

Write `.gtkrc-2.0.mine` in home dir:

```mine
gtk-font-name="Cantarell 12"
```

Write `gtk-3.0/gtk.css` in .config dir:

```css
* {
    fsdfont-weight: 600;
}
```

Write `gtk-4.0/settings.ini` in .config dir:

```ini
[Settings]
gtk-theme-name=Material-Black-Plum-BE
gtk-icon-theme-name=Material-Black-Plum-Suru
gtk-font-name=Inter Medium 12
gtk-cursor-theme-name=phinger-cursors-dark
gtk-cursor-theme-size=24
gtk-application-prefer-dark-theme=1
```

Write `gtk-3.0/settings.ini` in .config dir:

```ini
[Settings]
gtk-theme-name=Material-Black-Plum-BE
gtk-icon-theme-name=Material-Black-Plum-Suru
gtk-font-name=Inter Medium 12
gtk-cursor-theme-name=phinger-cursors-dark
gtk-cursor-theme-size=24
gtk-toolbar-style=GTK_TOOLBAR_ICONS
gtk-toolbar-icon-size=GTK_ICON_SIZE_LARGE_TOOLBAR
gtk-button-images=0
gtk-menu-images=0
gtk-enable-event-sounds=1
gtk-enable-input-feedback-sounds=0
gtk-xft-antialias=1
gtk-xft-hinting=1
gtk-xft-hintstyle=hintslight
gtk-xft-rgba=rgb
gtk-application-prefer-dark-theme=1
```
