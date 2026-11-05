import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useRecordSpecies, useSpecies, useUpdateSpecies, useWikiDetail, useWikiPreview } from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import {
  EMPTY_SPECIES_FORM,
  SpeciesForm,
  toSpeciesFormValue,
  toSpeciesPayload,
  type SpeciesFormValue,
} from '../components/species/SpeciesForm'
import { WikiPicker } from '../components/species/WikiPicker'
import { errorMessage } from '../api/client'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { Button, ErrorState, IconButton, Panel, Skeleton, notify } from '../components/ui'

/** 录入 / 编辑物种：维基候选补全 + 抓取预览 + 手动补充 */
export default function SpeciesEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const editingId = id ? Number(id) : null
  const isEdit = typeof editingId === 'number' && editingId > 0

  const [form, setForm] = useState<SpeciesFormValue>(EMPTY_SPECIES_FORM)
  const [keyword, setKeyword] = useState('')
  const [pickedTitle, setPickedTitle] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const existing = useSpecies(isEdit ? editingId : null)
  // 逐键防抖：维基检索会打外网，输入过程中不必每个字符都发请求
  const previewKeyword = useDebouncedValue(keyword, 350)
  const preview = useWikiPreview(previewKeyword, !isEdit && previewKeyword.trim().length > 0)
  const detail = useWikiDetail(pickedTitle)
  const recordSpecies = useRecordSpecies()
  const updateSpecies = useUpdateSpecies(editingId ?? 0)

  const photoIds = useMemo(
    () =>
      (search.get('photoIds') ?? '')
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0),
    [search],
  )

  useEffect(() => {
    if (existing.data && !hydrated) {
      setForm(toSpeciesFormValue(existing.data))
      setHydrated(true)
    }
  }, [existing.data, hydrated])

  // 顶栏快捷录入 / 待分类跳转过来时，用 URL 上的词条名预选维基候选
  useEffect(() => {
    if (isEdit) return
    const title = search.get('title')?.trim()
    if (!title) return
    setKeyword(title)
    setPickedTitle(title)
  }, [search, isEdit])

  const patch = (next: Partial<SpeciesFormValue>) => setForm((current) => ({ ...current, ...next }))

  const applyWikiDetail = () => {
    const info = detail.data?.detail
    if (!info) return
    patch({
      cnName: form.cnName || info.title.replace(/\s*\(.*\)$/, ''),
      scientificName: info.scientificName ?? form.scientificName,
      enName: info.enName ?? form.enName,
      orderName: info.orderName ?? form.orderName,
      familyName: info.familyName ?? form.familyName,
      genusName: info.genusName ?? form.genusName,
      iucnStatus: info.iucnStatus ?? form.iucnStatus,
      iucnYear: info.iucnYear ? String(info.iucnYear) : form.iucnYear,
      cnProtectionLevel: detail.data?.protection?.level ?? form.cnProtectionLevel,
      cnProtectionSource: detail.data?.protection?.source ?? form.cnProtectionSource,
      isSanyou: detail.data?.protection?.isSanyou ?? form.isSanyou,
      lengthCm: detail.data?.morphology?.lengthCm ?? form.lengthCm,
      weightG: detail.data?.morphology?.weightG ?? form.weightG,
      wingspanCm: detail.data?.morphology?.wingspanCm ?? form.wingspanCm,
      distribution: info.distribution?.length
        ? info.distribution
        : detail.data?.morphology?.distribution?.length
          ? detail.data.morphology.distribution
          : form.distribution,
      habitats: info.habitats?.length
        ? info.habitats
        : detail.data?.morphology?.habitats?.length
          ? detail.data.morphology.habitats
          : form.habitats,
      summaryZh: info.extract || form.summaryZh,
      summaryEn: info.extractEn ?? form.summaryEn,
    })
    notify.success('已填入维基资料', '可在表单中继续修改，保存后以你的版本为准')
  }

  const submit = () => {
    if (!form.cnName.trim()) {
      notify.error('中文名不能为空', '先填写一个中文名再保存')
      return
    }
    const payload = toSpeciesPayload(form)

    if (isEdit && editingId) {
      updateSpecies.mutate(payload, {
        onSuccess: () => {
          notify.success('资料已保存')
          navigate(`/species/${editingId}`)
        },
      })
      return
    }

    recordSpecies.mutate(
      {
        create: {
          cnName: form.cnName.trim(),
          group: form.group,
          scientificName: form.scientificName || null,
          isWishlist: form.isWishlist,
          wishNote: form.wishNote || null,
          note: form.note || null,
          wikiTitle: pickedTitle,
          autoFetch: Boolean(pickedTitle),
        },
        payload,
        photoIds,
      },
      {
        onSuccess: (created) => {
          notify.success(
            `已录入「${created.cnName}」`,
            photoIds.length ? `同时指派了 ${photoIds.length} 张照片` : undefined,
          )
          navigate(`/species/${created.id}`)
        },
      },
    )
  }

  const busy = recordSpecies.isPending || updateSpecies.isPending

  if (isEdit && existing.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    )
  }

  if (isEdit && existing.isError) {
    return <ErrorState message="物种资料加载失败，无法编辑" onRetry={() => void existing.refetch()} />
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isEdit ? `编辑「${existing.data?.cnName ?? ''}」` : '录入新物种'}
        subtitle={
          isEdit
            ? '修改会立即同步到图鉴、统计与卡片候选；已建卡片可在编辑器里重新生成摘要。'
            : '通过维基自动抓取基础资料，再补充自己的观察记录；未拍到的物种也可以先加入想拍清单。'
        }
        actions={
          <>
            <IconButton label="返回" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </IconButton>
            <Button icon={<Save className="h-4 w-4" />} loading={busy} onClick={submit}>
              {isEdit ? '保存修改' : '保存并进入详情'}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="物种资料" subtitle="带 * 的字段为必填，其余可后续补录">
          <SpeciesForm value={form} onChange={patch} />
        </Panel>

        <div className="flex flex-col gap-5">
          {!isEdit ? (
            <WikiPicker
              keyword={keyword}
              onKeywordChange={(next) => {
                setKeyword(next)
                setPickedTitle(null)
              }}
              candidates={preview.data?.candidates ?? []}
              loading={preview.isLoading || preview.isFetching}
              activeTitle={pickedTitle}
              onPick={setPickedTitle}
              detail={detail.data ?? null}
              detailLoading={detail.isLoading}
              errorMessage={preview.isError ? errorMessage(preview.error) : null}
              detailError={detail.isError ? errorMessage(detail.error) : null}
              onRetry={() => void preview.refetch()}
              onDetailRetry={() => void detail.refetch()}
              onApply={applyWikiDetail}
            />
          ) : (
            <Panel title="资料完整度" subtitle="补全越多，卡片与统计越准确">
              <ul className="flex flex-col gap-1.5 text-caption text-fog-200">
                <li>· 简介与分布：决定卡片效果框内容</li>
                <li>· 形态数据：详情页量规条</li>
                <li>· 保护级别：卡片星级与稀有度加成</li>
              </ul>
              <Button className="mt-3" variant="secondary" size="sm" onClick={() => navigate('/cards')}>
                去制作动物卡
              </Button>
            </Panel>
          )}

          {photoIds.length ? (
            <Panel title="待指派照片" subtitle={`保存后自动指派 ${photoIds.length} 张`}>
              <p className="text-caption text-fog-200">来自待分类池的选择：{photoIds.join('、')}</p>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  )
}
