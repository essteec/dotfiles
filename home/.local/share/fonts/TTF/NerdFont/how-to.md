# How to add nerd into a font

## Requirements

- fontforge [>](https://fontforge.org)
- fontpatcher [>](https://github.com/ryanoasis/nerd-fonts#font-patcher)

## Code

```bash
# Patch each style
mkdir -p ~/patched
for f in /path/to/*.ttf; do
  fontforge -script font-patcher "$f" --complete --outputdir ~/patched
done
```
