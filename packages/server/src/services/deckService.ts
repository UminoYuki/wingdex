import { getDb } from '../db'
import { all, one, run, type Row } from '../db/queries'
import { ApiError } from '../api/utils'
import { assertLimit } from './cardValidation'
import { getCard } from './cardService'

export interface Deck {
  id: number
  name: string
  description: string | null
  coverCardId: number | null
  cardCount: number
  legendCount: number
  createdAt: string
}

function mapDeck(row: Row): Deck {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    description: (row.description as string) ?? null,
    coverCardId: row.cover_card_id == null ? null : Number(row.cover_card_id),
    cardCount: Number(row.card_count ?? 0),
    legendCount: Number(row.legend_count ?? 0),
    createdAt: String(row.created_at ?? ''),
  }
}

export function listDecks(): Deck[] {
  return all<Row>(
    getDb(),
    `SELECT d.*,
      (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id) AS card_count,
      (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id AND c.rarity IN ('UR', 'LEGEND')) AS legend_count
     FROM decks d ORDER BY d.id ASC`,
  ).map(mapDeck)
}

export function getDeck(id: number): Deck {
  const row = one<Row>(
    getDb(),
    `SELECT d.*,
      (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id) AS card_count,
      (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id AND c.rarity IN ('UR', 'LEGEND')) AS legend_count
     FROM decks d WHERE d.id = ?`,
    [id],
  )
  if (!row) throw new ApiError(404, `未找到卡组 #${id}`)
  return mapDeck(row)
}

export function createDeck(input: { name: string; description?: string | null; coverCardId?: number | null }): Deck {
  const name = input.name.trim()
  if (!name) throw new ApiError(400, '卡组名称不能为空')
  assertLimit('卡组名称', name, 20)
  const info = getDb()
    .prepare('INSERT INTO decks (name, description, cover_card_id) VALUES (?, ?, ?)')
    .run(name, input.description ?? null, input.coverCardId ?? null)
  return getDeck(Number(info.lastInsertRowid))
}

export function updateDeck(
  id: number,
  patch: { name?: string; description?: string | null; coverCardId?: number | null },
): Deck {
  getDeck(id)
  const sets: string[] = []
  const params: unknown[] = []
  if (patch.name !== undefined) {
    assertLimit('卡组名称', patch.name, 20)
    sets.push('name = ?')
    params.push(patch.name)
  }
  if (patch.description !== undefined) {
    sets.push('description = ?')
    params.push(patch.description)
  }
  if (patch.coverCardId !== undefined) {
    if (patch.coverCardId !== null) {
      const card = getCard(patch.coverCardId)
      if (card.deckId !== id) throw new ApiError(400, '封面卡片必须属于该卡组')
    }
    sets.push('cover_card_id = ?')
    params.push(patch.coverCardId)
  }
  if (sets.length) run(getDb(), `UPDATE decks SET ${sets.join(', ')} WHERE id = ?`, [...params, id])
  return getDeck(id)
}

export function deleteDeck(id: number): void {
  getDeck(id)
  run(getDb(), 'UPDATE cards SET deck_id = NULL WHERE deck_id = ?', [id])
  run(getDb(), 'DELETE FROM decks WHERE id = ?', [id])
}

export function assignCards(cardIds: number[], deckId: number | null): number {
  if (deckId !== null) getDeck(deckId)
  const db = getDb()
  const stmt = db.prepare(`UPDATE cards SET deck_id = ?, updated_at = datetime('now') WHERE id = ?`)
  const tx = db.transaction((ids: number[]) => {
    let changed = 0
    for (const id of ids) {
      getCard(id)
      changed += stmt.run(deckId, id).changes
    }
    return changed
  })
  return tx(cardIds)
}

export function reorderCards(cardIds: number[]): void {
  const db = getDb()
  const stmt = db.prepare(`UPDATE cards SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`)
  const tx = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => stmt.run(index, id))
  })
  tx(cardIds)
}
