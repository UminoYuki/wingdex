import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, type QueryValue } from './client'
import type {
  AchievementsResponse,
  Card,
  CardDefaults,
  CardListItem,
  CardStats,
  CardTemplate,
  Deck,
  ExportFile,
  Facets,
  GeoResponse,
  HealthResponse,
  LibraryRoot,
  Photo,
  PhotoListResponse,
  Place,
  ProtectionMatch,
  ScanResult,
  ScanStatus,
  SettingsResponse,
  Species,
  SpeciesListResponse,
  SpeciesWithStats,
  StatsBundle,
  WikiDetail,
  WikiPreview,
  Morphology,
} from './types'

export const queryKeys = {
  health: ['health'] as const,
  stats: ['stats'] as const,
  species: (filters?: Record<string, QueryValue>) => ['species', filters ?? {}] as const,
  speciesDetail: (id: number) => ['species', id] as const,
  facets: ['species', 'facets'] as const,
  photos: (filters?: Record<string, QueryValue>) => ['photos', filters ?? {}] as const,
  places: ['places'] as const,
  geoWorld: ['geo', 'world'] as const,
  geoPoints: (filters?: Record<string, QueryValue>) => ['geo', 'points', filters ?? {}] as const,
  geoMissing: (limit = 50) => ['geo', 'missing', limit] as const,
  cards: (filters?: Record<string, QueryValue>) => ['cards', filters ?? {}] as const,
  cardDetail: (id: number) => ['cards', id] as const,
  cardDefaults: (speciesId: number) => ['cards', 'defaults', speciesId] as const,
  cardStats: ['cards', 'stats'] as const,
  templates: ['templates'] as const,
  decks: ['decks'] as const,
  exports: ['exports'] as const,
  achievements: ['achievements'] as const,
  wishlist: ['wishlist'] as const,
  scan: ['scan'] as const,
  roots: ['roots'] as const,
  settings: ['settings'] as const,
  wikiPreview: (q: string) => ['wiki', 'preview', q] as const,
  assets: ['media', 'assets'] as const,
}

function invalidateAll(client: QueryClient, keys: ReadonlyArray<readonly unknown[]>): void {
  for (const key of keys) void client.invalidateQueries({ queryKey: key })
}

export interface GeoPointItem {
  id: number
  name: string
  lat: number
  lon: number
  photos: number
  species: number
  lastSeenAt?: string | null
  speciesIds?: number[]
}

export interface GeoPointsResponse {
  items: GeoPointItem[]
  summary: { points: number; photos: number; species: number }
}

export interface GeoMissingItem {
  id: number
  fileName: string
  takenAt: string | null
  placeName: string | null
  speciesCnName: string | null
}

/** 世界轮廓（GeoJSON FeatureCollection，服务端本地缓存） */
export function useGeoWorld(enabled = true) {
  return useQuery({
    queryKey: ['geo', 'world'],
    queryFn: () => api.get<GeoResponse>('/geo/world'),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useGeoChina(enabled = true) {
  return useQuery({
    queryKey: ['geo', 'china'],
    queryFn: () => api.get<GeoResponse>('/geo/china'),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useGeoPoints(filters: { habitat?: string; speciesId?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.geoPoints(filters),
    queryFn: () => api.get<GeoPointsResponse>('/geo/points', filters as Record<string, QueryValue>),
  })
}

export function useGeoMissing(limit = 50) {
  return useQuery({
    queryKey: queryKeys.geoMissing(limit),
    queryFn: () => api.get<{ items: GeoMissingItem[] }>('/geo/missing', { limit }),
  })
}

export function useHealth() {
  return useQuery({ queryKey: queryKeys.health, queryFn: () => api.get<HealthResponse>('/health') })
}

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats, queryFn: () => api.get<StatsBundle>('/stats') })
}

/** 物种筛选：字段与 server/api/routes/species.ts listSchema 对齐 */
export interface SpeciesFilters {
  q?: string
  group?: string
  order?: string
  family?: string
  protection?: string
  habitat?: string
  camera?: string
  lens?: string
  favorite?: boolean
  wishlist?: boolean
  sort?: 'recent' | 'photos' | 'name' | 'first' | 'stars'
  limit?: number
  offset?: number
}

export function useSpeciesList(filters: SpeciesFilters = {}) {
  return useQuery({
    queryKey: queryKeys.species(filters as Record<string, QueryValue>),
    queryFn: () => api.get<SpeciesListResponse>('/species', filters as Record<string, QueryValue>),
  })
}

export function useSpecies(id: number | null) {
  return useQuery({
    queryKey: queryKeys.speciesDetail(id ?? 0),
    queryFn: () => api.get<SpeciesWithStats>(`/species/${id}`),
    enabled: typeof id === 'number' && id > 0,
  })
}

/** 某物种下的照片（服务端 /species/:id/photos） */
export function useSpeciesPhotos(id: number | null, options: { limit?: number; offset?: number } = {}) {
  const { limit = 120, offset = 0 } = options
  return useQuery({
    queryKey: ['species', id ?? 0, 'photos', limit, offset],
    queryFn: () => api.get<PhotoListResponse>(`/species/${id}/photos`, { limit, offset }),
    enabled: typeof id === 'number' && id > 0,
  })
}

export interface SpeciesOption {
  id: number
  cnName: string
  scientificName: string | null
}

/** 指派候选：轻量物种下拉（服务端 /species/options） */
export function useSpeciesOptions(enabled = true) {
  return useQuery({
    queryKey: ['species', 'options'],
    queryFn: () => api.get<{ items: SpeciesOption[] }>('/species/options'),
    enabled,
    staleTime: 60_000,
  })
}

export function useFacets() {
  return useQuery({ queryKey: queryKeys.facets, queryFn: () => api.get<Facets>('/species/facets'), staleTime: 60_000 })
}

export interface SpeciesPayload {
  cnName?: string
  scientificName?: string | null
  enName?: string | null
  aliases?: string[]
  group?: string | null
  orderName?: string | null
  familyName?: string | null
  genusName?: string | null
  iucnStatus?: string | null
  iucnYear?: number | null
  cnProtectionLevel?: string | null
  cnProtectionSource?: string | null
  isSanyou?: boolean
  lengthCm?: string | null
  weightG?: string | null
  wingspanCm?: string | null
  distribution?: string[]
  tags?: string[]
  habitats?: string[]
  residenceType?: string | null
  diet?: string | null
  ecoType?: string | null
  summaryZh?: string | null
  summaryEn?: string | null
  wikiTitle?: string | null
  wikiUrl?: string | null
  wikiEnUrl?: string | null
  qid?: string | null
  wikiImageKey?: string | null
  imageCredit?: string | null
  fetchStatus?: string
  isFavorite?: boolean
  isWishlist?: boolean
  wishNote?: string | null
  note?: string | null
  coverPhotoId?: number | null
  soundPath?: string | null
  videoPath?: string | null
}

export function useCreateSpecies() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: SpeciesPayload) => api.post<Species>('/species', payload),
    onSuccess: () => invalidateAll(client, [queryKeys.species(), queryKeys.facets, queryKeys.stats, queryKeys.health]),
  })
}

export interface CreateSpeciesPayload {
  cnName: string
  group?: string
  scientificName?: string | null
  enName?: string | null
  isWishlist?: boolean
  wishNote?: string | null
  note?: string | null
  wikiTitle?: string | null
  autoFetch?: boolean
}

/**
 * 录入流程：先建基础档案（可选自动抓取维基），再写入完整表单，最后把待分类照片指派过去。
 * 服务端 createSchema 只接受基础字段，因此完整字段走一次 PATCH。
 */
export function useRecordSpecies() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      create: CreateSpeciesPayload
      payload?: Record<string, unknown>
      photoIds?: number[]
    }) => {
      const created = await api.post<Species>('/species', input.create)
      const species = input.payload ? await api.patch<Species>(`/species/${created.id}`, input.payload) : created
      if (input.photoIds?.length) await api.post('/photos/assign', { photoIds: input.photoIds, speciesId: created.id })
      return species
    },
    onSuccess: () =>
      invalidateAll(client, [
        queryKeys.species(),
        queryKeys.facets,
        queryKeys.stats,
        queryKeys.health,
        queryKeys.achievements,
      ]),
  })
}

export function useUpdateSpecies(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: SpeciesPayload) => api.patch<Species>(`/species/${id}`, payload),
    onSuccess: () =>
      invalidateAll(client, [
        queryKeys.species(),
        queryKeys.speciesDetail(id),
        queryKeys.facets,
        queryKeys.stats,
        queryKeys.achievements,
      ]),
  })
}

export function useDeleteSpecies() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<{ ok: boolean }>(`/species/${id}`),
    onSuccess: () => invalidateAll(client, [queryKeys.species(), queryKeys.stats, queryKeys.health]),
  })
}

/** 重新抓取维基资料（POST /species/:id/refresh） */
export function useRefreshSpecies(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { wikiTitle?: string | null } = {}) =>
      api.post<Species>(`/species/${id}/refresh`, payload),
    onSuccess: () =>
      invalidateAll(client, [
        queryKeys.species(),
        queryKeys.speciesDetail(id),
        queryKeys.facets,
        queryKeys.stats,
        queryKeys.achievements,
      ]),
  })
}

export function useToggleSpeciesFlag(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { isFavorite?: boolean; isWishlist?: boolean; wishNote?: string | null }) =>
      api.patch<Species>(`/species/${id}`, payload),
    onSuccess: () =>
      invalidateAll(client, [
        queryKeys.species(),
        queryKeys.speciesDetail(id),
        queryKeys.wishlist,
        queryKeys.stats,
        queryKeys.achievements,
      ]),
  })
}

/** 跨物种批量切换收藏 / 想拍标记（列表页用，id 随载荷传入） */
export function useUpdateSpeciesFlags() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: { id: number; isFavorite?: boolean; isWishlist?: boolean; wishNote?: string | null }) =>
      api.patch<Species>(`/species/${id}`, patch),
    onSuccess: (_data, variables) =>
      invalidateAll(client, [
        queryKeys.species(),
        queryKeys.speciesDetail(variables.id),
        queryKeys.wishlist,
        queryKeys.stats,
        queryKeys.achievements,
      ]),
  })
}

/** 照片筛选：字段与 server/api/routes/photos.ts listSchema 对齐 */
export interface PhotoFilters {
  speciesId?: number
  placeId?: number
  unassigned?: boolean
  rating?: number
  favorite?: boolean
  camera?: string
  lens?: string
  q?: string
  from?: string
  to?: string
  order?: 'taken_desc' | 'taken_asc' | 'imported_desc'
  limit?: number
  offset?: number
}

export function usePhotos(filters: PhotoFilters = {}) {
  return useQuery({
    queryKey: queryKeys.photos(filters as Record<string, QueryValue>),
    queryFn: () => api.get<PhotoListResponse>('/photos', filters as Record<string, QueryValue>),
  })
}

/** 单张照片详情（灯箱用，避免拉全量列表） */
export function usePhoto(id: number | null) {
  return useQuery({
    queryKey: ['photo', id ?? 0],
    queryFn: () => api.get<Photo>(`/photos/${id}`),
    enabled: typeof id === 'number' && id > 0,
  })
}

export function useUpdatePhoto() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number } & Record<string, unknown>) =>
      api.patch<Photo>(`/photos/${id}`, patch),
    onSuccess: () => invalidateAll(client, [queryKeys.photos(), queryKeys.species(), queryKeys.stats]),
  })
}

export function useAssignPhotos() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { photoIds: number[]; speciesId: number | null }) =>
      api.post<{ changed: number }>('/photos/assign', payload),
    onSuccess: () =>
      invalidateAll(client, [
        queryKeys.photos(),
        queryKeys.species(),
        queryKeys.stats,
        queryKeys.cards(),
        queryKeys.achievements,
        queryKeys.places,
      ]),
  })
}

export function useDeletePhoto() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<{ ok: boolean }>(`/photos/${id}`),
    onSuccess: () => invalidateAll(client, [queryKeys.photos(), queryKeys.species(), queryKeys.stats]),
  })
}

export function usePlaces() {
  return useQuery({ queryKey: queryKeys.places, queryFn: () => api.get<{ items: Place[] }>('/places') })
}

export function useCreatePlace() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; lat?: number | null; lon?: number | null; iconKey?: string; note?: string }) =>
      api.post<Place>('/places', payload),
    onSuccess: () => invalidateAll(client, [queryKeys.places, queryKeys.stats]),
  })
}

export function useUpdatePlace() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number } & Record<string, unknown>) => api.patch<Place>(`/places/${id}`, patch),
    onSuccess: () => invalidateAll(client, [queryKeys.places, queryKeys.stats]),
  })
}

export function useDeletePlace() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<{ ok: boolean }>(`/places/${id}`),
    onSuccess: () => invalidateAll(client, [queryKeys.places, queryKeys.stats]),
  })
}

/** 把未定位照片指派到某个地点（用于足迹地图补录） */
export function useAssignPlacePhotos() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { placeId: number; photoIds: number[] }) =>
      api.post<{ changed: number }>(`/places/${payload.placeId}/photos`, { photoIds: payload.photoIds }),
    onSuccess: () =>
      invalidateAll(client, [
        queryKeys.geoPoints(),
        queryKeys.geoMissing(),
        queryKeys.places,
        queryKeys.photos(),
        queryKeys.stats,
      ]),
  })
}

export function useWikiPreview(keyword: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.wikiPreview(keyword),
    queryFn: () => api.get<WikiPreview>('/wiki/preview', { q: keyword }),
    enabled: enabled && keyword.trim().length >= 1,
    staleTime: 5 * 60_000,
    retry: 0,
  })
}

export function useWikiDetail(title: string | null) {
  return useQuery({
    queryKey: ['wiki', 'detail', title ?? ''],
    queryFn: () =>
      api.get<{ detail: WikiDetail | null; morphology: Morphology | null; protection: ProtectionMatch | null; cardSummary: string | null }>(
        '/wiki/detail',
        { title: title ?? '' },
      ),
    enabled: Boolean(title),
    staleTime: 10 * 60_000,
    retry: 0,
  })
}

export function useWishlist() {
  return useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: () => api.get<{ items: SpeciesWithStats[]; total: number }>('/wishlist'),
  })
}

export function useScanStatus() {
  return useQuery({
    queryKey: queryKeys.scan,
    queryFn: () => api.get<ScanStatus>('/scan/status'),
    refetchInterval: (query) => ((query.state.data as ScanStatus | undefined)?.running ? 900 : false),
  })
}

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: () => api.get<SettingsResponse>('/settings') })
}

export function useRoots() {
  return useQuery({ queryKey: queryKeys.roots, queryFn: () => api.get<{ items: LibraryRoot[] }>('/roots') })
}

export function useAddRoot() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { path: string; note?: string }) => api.post<{ ok: boolean }>('/roots', payload),
    onSuccess: () => invalidateAll(client, [queryKeys.roots, queryKeys.scan]),
  })
}

export function useRemoveRoot() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<{ ok: boolean }>(`/roots/${id}`),
    onSuccess: () => invalidateAll(client, [queryKeys.roots, queryKeys.scan]),
  })
}

export function useStartScan() {
  const client = useQueryClient()
  return useMutation({
    // 服务端 scanSchema：{ root: 目录绝对路径, async?: false 时同步返回结果 }
    mutationFn: (payload: { root: string; async?: boolean }) =>
      api.post<ScanResult | { accepted: boolean; root: string }>('/scan', payload),
    onSuccess: () =>
      invalidateAll(client, [queryKeys.scan, queryKeys.photos(), queryKeys.species(), queryKeys.stats, queryKeys.roots]),
  })
}

export function useVerifyLibrary() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ checked: number; missing: number }>('/scan/verify'),
    onSuccess: () => invalidateAll(client, [queryKeys.photos()]),
  })
}

export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.achievements,
    queryFn: () => api.get<AchievementsResponse>('/achievements'),
    staleTime: 30_000,
  })
}

export function useRefreshAchievements() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ unlocked: string[] }>('/achievements/refresh'),
    onSuccess: () => invalidateAll(client, [queryKeys.achievements, queryKeys.stats]),
  })
}

export function useCardList(filters: Record<string, QueryValue> = {}) {
  return useQuery({
    queryKey: queryKeys.cards(filters),
    queryFn: () => api.get<{ items: CardListItem[]; total: number }>('/cards', filters),
  })
}

export function useCard(id: number | null) {
  return useQuery({
    queryKey: queryKeys.cardDetail(id ?? 0),
    queryFn: () =>
      api.get<{
        card: Card
        species: SpeciesWithStats
        photo: Photo | null
        photos: Photo[]
        editable: { photoCount: number; fiveStarCount: number; behaviorCount: number }
      }>(`/cards/${id}`),
    enabled: typeof id === 'number' && id > 0,
  })
}

export interface CardDefaultsResponse {
  defaults: CardDefaults
  photos: Photo[]
}

export function useCardDefaults(speciesId: number | null, photoId?: number | null) {
  return useQuery({
    queryKey: [...queryKeys.cardDefaults(speciesId ?? 0), photoId ?? 0],
    queryFn: () =>
      api.get<CardDefaultsResponse>('/cards/defaults', { speciesId: speciesId ?? 0, photoId: photoId ?? undefined }),
    enabled: typeof speciesId === 'number' && speciesId > 0,
    staleTime: 30_000,
  })
}

export function useCardStats() {
  return useQuery({ queryKey: queryKeys.cardStats, queryFn: () => api.get<CardStats>('/cards/stats') })
}

export function useCreateCard() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { speciesId: number; photoId?: number | null } & Record<string, unknown>) =>
      api.post<Card>('/cards', payload),
    onSuccess: () =>
      invalidateAll(client, [queryKeys.cards(), queryKeys.cardStats, queryKeys.stats, queryKeys.achievements, queryKeys.species()]),
  })
}

export function useUpdateCard(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.patch<Card>(`/cards/${id}`, payload),
    onSuccess: () =>
      invalidateAll(client, [
        queryKeys.cards(),
        queryKeys.cardDetail(id),
        queryKeys.cardStats,
        queryKeys.species(),
        queryKeys.achievements,
      ]),
  })
}

export function useDeleteCard() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<{ ok: boolean }>(`/cards/${id}`),
    onSuccess: () => invalidateAll(client, [queryKeys.cards(), queryKeys.cardStats, queryKeys.stats]),
  })
}

/** 重新生成卡面文本：force=true 时用 summarizeForCard() 覆盖为自动精简结果 */
export function useRegenerateCardTexts(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (force: boolean) => api.post<Card>(`/cards/${id}/regenerate`, { force }),
    onSuccess: () => invalidateAll(client, [queryKeys.cardDetail(id), queryKeys.cards()]),
  })
}

/** 重算星级与 ATK/DEF（沿用服务端规则） */
export function useRecalcCard(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Card>(`/cards/${id}/recalc`),
    onSuccess: () =>
      invalidateAll(client, [queryKeys.cardDetail(id), queryKeys.cards(), queryKeys.cardStats]),
  })
}

export interface StickerAsset {
  key: string
  name: string
  createdAt: string
  bytes: number
}

/** 本地贴纸资源库（上传后可在卡面自由贴纸层使用） */
export function useStickers() {
  return useQuery({
    queryKey: queryKeys.assets,
    queryFn: () => api.get<{ items: StickerAsset[] }>('/media/assets'),
    staleTime: 60_000,
  })
}

export function useUploadSticker() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; dataUrl: string }) =>
      api.post<StickerAsset>('/media/assets', payload),
    onSuccess: () => invalidateAll(client, [queryKeys.assets]),
  })
}

export function useDeleteSticker() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => api.delete<{ ok: boolean }>(`/media/asset/${encodeURIComponent(key)}`),
    onSuccess: () => invalidateAll(client, [queryKeys.assets]),
  })
}

export function useDuplicateCard() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post<Card>(`/cards/${id}/duplicate`),
    onSuccess: () => invalidateAll(client, [queryKeys.cards(), queryKeys.cardStats]),
  })
}

export function useTemplates() {
  return useQuery({ queryKey: queryKeys.templates, queryFn: () => api.get<{ items: CardTemplate[] }>('/card-templates') })
}

export function useCreateTemplate() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; cardId?: number; preset?: string; overrides?: unknown; layers?: unknown; backConfig?: unknown }) =>
      api.post<CardTemplate>('/card-templates', payload),
    onSuccess: () => invalidateAll(client, [queryKeys.templates, queryKeys.achievements]),
  })
}

export function useApplyTemplate() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cardId, speciesId }: { id: number; cardId?: number; speciesId?: number }) =>
      api.post<{ cards: number[] }>(`/card-templates/${id}/apply`, { cardId, speciesId }),
    onSuccess: () => invalidateAll(client, [queryKeys.cards(), queryKeys.cardStats]),
  })
}

export function useDeleteTemplate() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<{ ok: boolean }>(`/card-templates/${id}`),
    onSuccess: () => invalidateAll(client, [queryKeys.templates]),
  })
}

export function useDecks() {
  return useQuery({ queryKey: queryKeys.decks, queryFn: () => api.get<{ items: Deck[] }>('/decks') })
}

export function useCreateDeck() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; description?: string; coverCardId?: number | null }) =>
      api.post<Deck>('/decks', payload),
    onSuccess: () => invalidateAll(client, [queryKeys.decks, queryKeys.cardStats]),
  })
}

export function useUpdateDeck() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number } & Record<string, unknown>) => api.patch<Deck>(`/decks/${id}`, patch),
    onSuccess: () => invalidateAll(client, [queryKeys.decks, queryKeys.cards(), queryKeys.cardStats]),
  })
}

export function useDeleteDeck() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<{ ok: boolean }>(`/decks/${id}`),
    onSuccess: () => invalidateAll(client, [queryKeys.decks, queryKeys.cards(), queryKeys.cardStats]),
  })
}

export function useExports() {
  return useQuery({ queryKey: queryKeys.exports, queryFn: () => api.get<{ items: ExportFile[] }>('/exports') })
}

export function useDeleteExport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (file: string) => api.delete<{ ok: boolean }>(`/exports/${encodeURIComponent(file)}`),
    onSuccess: () => invalidateAll(client, [queryKeys.exports]),
  })
}

export function useSaveExport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: { fileName: string; dataUrl: string }) => api.post<ExportFile>('/exports', payload),
    onSuccess: () => invalidateAll(client, [queryKeys.exports, queryKeys.achievements]),
  })
}
