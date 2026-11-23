# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:$HOME/.local/bin:/usr/local/bin:$PATH
# export PATH=$HOME/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/opt/cuda/bin:/var/lib/flatpak/exports/bin:/usr/lib/jvm/default/bin:/usr/bin/site_perl:/usr/bin/vendor_perl:/usr/bin/core_perl:$HOME/.local/share/pnpm/bin:/usr/lib/rustup/bin

# Add path dotnet tools
export PATH="$PATH:$HOME/.dotnet/tools"

# Path to your Oh My Zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# Set name of the theme to load --- if set to "random", it will
# load a random theme each time Oh My Zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
ZSH_THEME="powerlevel10k/powerlevel10k"

# Option B: Starship (Modern, Rust-based, minimal, cross-shell)
# To use: comment out ZSH_THEME above, install starship (pacman -S starship), 
# and uncomment the line below (and add 'eval "$(starship init zsh)"' at the end of file).
# ZSH_THEME="robbyrussel"

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment one of the following lines to change the auto-update behavior
# zstyle ':omz:update' mode disabled  # disable automatic updates
# zstyle ':omz:update' mode auto      # update automatically without asking
zstyle ':omz:update' mode reminder  # just remind me to update when it's time

# Uncomment the following line to change the frequency the auto-updater is run (in days).
zstyle ':omz:update' frequency 2

# Uncomment the following line if pasting URLs and other text is messed up.
# DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(
  git
  # gh
  # archlinux
  docker
  # docker-compose
  fzf
  sudo
  extract
  colored-man-pages
  z
  nvm
  # uv
  alias-finder
  ufw
  zsh-autosuggestions
  # history-substring-search
  zsh-syntax-highlighting
)

source $ZSH/oh-my-zsh.sh


# zsh configuration
# When a command entered prefixed one space it wont write in history
setopt HIST_IGNORE_SPACE

export HISTSIZE=12000
export SAVEHIST=10000

# User configuration
# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='nvim'
# fi
export EDITOR='vim'
export BAT_PAGER="less -I"

export ZSH_HIGHLIGHT_STYLES[comment]='none'

# Compilation flags
# export ARCHFLAGS="-arch $(uname -m)"

# Set personal aliases, overriding those provided by Oh My Zsh libs,
# plugins, and themes. Aliases can be placed here, though Oh My Zsh
# users are encouraged to define aliases within a top-level file in
# the $ZSH_CUSTOM folder, with .zsh extension. Examples:
# - $ZSH_CUSTOM/aliases.zsh
# - $ZSH_CUSTOM/macos.zsh
# For a full list of active aliases, run `alias`.

# ls
alias ls='eza'
alias ll='ls -lh'
alias la='ls -A'
alias lla='ls -lAh'
alias lt='eza --tree'
alias lta='eza -a --tree'
alias tree='lsd --tree'
alias treea='lsd -a --tree'

# file manipulation
alias cp='cp -i'
alias mv='mv -i'
alias rm='rm -i'

# alias v='nvim'
# alias vim='nvim'
# alias sv='sudo nvim'

# arch
alias upd='sudo reflector --latest 16 --protocol https --sort rate --save /etc/pacman.d/mirrorlist; sleep 10; yay -Syu'
# alias in='sudo pacman -S'            # Install package
# alias rem='sudo pacman -Rns'         # Remove package + dependencies
# alias cleanup='sudo pacman -Rns $(pacman -Qtdq)' # Remove orphaned packages

# functions

mkcd() {
  mkdir -p "$1" && cd "$1"
}

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
