import { create } from 'zustand'
import { applyTheme, parseTheme, PREFS_STORAGE_KEY, THEME_STORAGE_KEY, type AppThemeId } from '../theme/skins'
import {
  parseBackSkin,
  parseCardSkin,
  parseDeckView,
  type BackSkinId,
  type CardSkinId,
  type DeckViewId,
} from '../card/skins/cardSkin'

export interface StoredPrefs {
  theme: AppThemeId
  cardSkin: CardSkinId
  backSkin: BackSkinId
  deckView: DeckViewId
}

export const DEFAULT_PREFS: StoredPrefs = {
  theme: 'forest',
  cardSkin: 'atlas',
  backSkin: 'archive',
  deckView: 'wall',
}

export function parsePrefs(raw: unknown, themeHint?: string | null): StoredPrefs {
  const record = raw && typeof raw === 'object' ? (raw as Partial<StoredPrefs>) : {}
  return {
    theme: parseTheme(record.theme, parseTheme(themeHint)),
    cardSkin: parseCardSkin(record.cardSkin),
    backSkin: parseBackSkin(record.backSkin),
    deckView: parseDeckView(record.deckView),
  }
}

function readPrefs(): StoredPrefs {
  if (typeof localStorage === 'undefined') return DEFAULT_PREFS
  try {
    const themeHint = localStorage.getItem(THEME_STORAGE_KEY)
    const raw = localStorage.getItem(PREFS_STORAGE_KEY)
    if (!raw) return parsePrefs(null, themeHint)
    return parsePrefs(JSON.parse(raw), themeHint)
  } catch {
    return DEFAULT_PREFS
  }
}

function writePrefs(prefs: StoredPrefs): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
    localStorage.setItem(THEME_STORAGE_KEY, prefs.theme)
  } catch {
    /* 隐私模式或配额不足时仍可在本次会话里切换 */
  }
}

interface PrefsState extends StoredPrefs {
  setTheme: (theme: AppThemeId) => void
  setCardSkin: (cardSkin: CardSkinId) => void
  setBackSkin: (backSkin: BackSkinId) => void
  setDeckView: (deckView: DeckViewId) => void
}

function commit(partial: Partial<StoredPrefs>): Partial<PrefsState> {
  return partial
}

export const usePrefsStore = create<PrefsState>((set, get) => ({
  ...readPrefs(),
  setTheme: (theme) => {
    const next = { ...pick(get()), theme }
    writePrefs(next)
    applyTheme(theme)
    set(commit({ theme }))
  },
  setCardSkin: (cardSkin) => {
    const next = { ...pick(get()), cardSkin }
    writePrefs(next)
    set(commit({ cardSkin }))
  },
  setBackSkin: (backSkin) => {
    const next = { ...pick(get()), backSkin }
    writePrefs(next)
    set(commit({ backSkin }))
  },
  setDeckView: (deckView) => {
    const next = { ...pick(get()), deckView }
    writePrefs(next)
    set(commit({ deckView }))
  },
}))

function pick(state: PrefsState): StoredPrefs {
  return {
    theme: state.theme,
    cardSkin: state.cardSkin,
    backSkin: state.backSkin,
    deckView: state.deckView,
  }
}
