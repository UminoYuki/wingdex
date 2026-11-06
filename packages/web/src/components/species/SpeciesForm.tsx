import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge, Field, Input, Select, Switch, Textarea } from '../ui'
import { cn } from '../../lib/cn'

export interface SpeciesFormValue {
  cnName: string
  group: string
  scientificName: string
  enName: string
  orderName: string
  familyName: string
  genusName: string
  iucnStatus: string
  iucnYear: string
  cnProtectionLevel: string
  cnProtectionSource: string
  isSanyou: boolean
  lengthCm: string
  weightG: string
  wingspanCm: string
  residenceType: string
  ecoType: string
  diet: string
  note: string
  wishNote: string
  summaryZh: string
  summaryEn: string
  soundPath: string
  videoPath: string
  distribution: string[]
  habitats: string[]
  tags: string[]
  isFavorite: boolean
  isWishlist: boolean
}

export const EMPTY_SPECIES_FORM: SpeciesFormValue = {
  cnName: '',
  group: '鸟纲',
  scientificName: '',
  enName: '',
  orderName: '',
  familyName: '',
  genusName: '',
  iucnStatus: '',
  iucnYear: '',
  cnProtectionLevel: '',
  cnProtectionSource: '',
  isSanyou: false,
  lengthCm: '',
  weightG: '',
  wingspanCm: '',
  residenceType: '',
  ecoType: '',
  diet: '',
  note: '',
  wishNote: '',
  summaryZh: '',
  summaryEn: '',
  soundPath: '',
  videoPath: '',
  distribution: [],
  habitats: [],
  tags: [],
  isFavorite: false,
  isWishlist: false,
}

const GROUP_OPTIONS = ['鸟纲', '哺乳纲', '两栖纲', '爬行纲', '昆虫纲', '鱼纲', '其他'].map((value) => ({
  value,
  label: value,
}))

const IUCN_OPTIONS = ['', 'LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD'].map((value) => ({
  value,
  label: value || '未评估',
}))

const PROTECTION_OPTIONS = ['', '国家一级', '国家二级', '三有', '地方重点'].map((value) => ({
  value,
  label: value || '无',
}))

interface SpeciesFormProps {
  value: SpeciesFormValue
  onChange: (patch: Partial<SpeciesFormValue>) => void
  className?: string
}

/** 物种录入 / 编辑表单：名称分类、保护形态、分布栖息、双语简介 */
export function SpeciesForm({ value, onChange, className }: SpeciesFormProps) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <section className="flex flex-col gap-4">
        <h3 className="text-title text-fog-100">一、名称与分类</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="中文名" required hint="卡片正面使用，建议 10 字以内">
            <Input
              value={value.cnName}
              placeholder="例如 白鹭"
              onChange={(event) => onChange({ cnName: event.target.value })}
            />
          </Field>
          <Field label="学名" hint="拉丁学名，卡片背面与资料页展示">
            <Input
              value={value.scientificName}
              placeholder="例如 Egretta garzetta"
              onChange={(event) => onChange({ scientificName: event.target.value })}
            />
          </Field>
          <Field label="英文名">
            <Input
              value={value.enName}
              placeholder="例如 Little Egret"
              onChange={(event) => onChange({ enName: event.target.value })}
            />
          </Field>
          <Field label="类群">
            <Select value={value.group} options={GROUP_OPTIONS} onValueChange={(next) => onChange({ group: next })} />
          </Field>
          <Field label="目">
            <Input value={value.orderName} placeholder="例如 鹈形目" onChange={(event) => onChange({ orderName: event.target.value })} />
          </Field>
          <Field label="科">
            <Input value={value.familyName} placeholder="例如 鹭科" onChange={(event) => onChange({ familyName: event.target.value })} />
          </Field>
          <Field label="属">
            <Input value={value.genusName} placeholder="例如 白鹭属" onChange={(event) => onChange({ genusName: event.target.value })} />
          </Field>
          <Field label="居留型 / 生态型" hint="候鸟、留鸟、迷鸟；涉禽、猛禽等">
            <div className="flex gap-2">
              <Input
                value={value.residenceType}
                placeholder="留鸟"
                onChange={(event) => onChange({ residenceType: event.target.value })}
              />
              <Input value={value.ecoType} placeholder="涉禽" onChange={(event) => onChange({ ecoType: event.target.value })} />
            </div>
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-title text-fog-100">二、保护与形态</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="IUCN 等级">
            <Select
              value={value.iucnStatus}
              options={IUCN_OPTIONS}
              onValueChange={(next) => onChange({ iucnStatus: next })}
            />
          </Field>
          <Field label="国内保护">
            <Select
              value={value.cnProtectionLevel}
              options={PROTECTION_OPTIONS}
              onValueChange={(next) => onChange({ cnProtectionLevel: next })}
            />
          </Field>
          <Field label="评估年份">
            <Input
              value={value.iucnYear}
              placeholder="2024"
              onChange={(event) => onChange({ iucnYear: event.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
            />
          </Field>
          <Field label="体长" hint="支持 12-15 这样的区间">
            <Input value={value.lengthCm} placeholder="55-65" onChange={(event) => onChange({ lengthCm: event.target.value })} />
          </Field>
          <Field label="体重">
            <Input value={value.weightG} placeholder="350-500" onChange={(event) => onChange({ weightG: event.target.value })} />
          </Field>
          <Field label="翼展">
            <Input value={value.wingspanCm} placeholder="88-106" onChange={(event) => onChange({ wingspanCm: event.target.value })} />
          </Field>
        </div>
        <Switch
          checked={value.isSanyou}
          onCheckedChange={(checked) => onChange({ isSanyou: checked })}
          label="列入「三有名录」"
          hint="国家保护的有重要生态、科学、社会价值的陆生野生动物"
        />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-title text-fog-100">三、分布与栖息</h3>
        <ChipInput
          label="分布区域"
          hint="回车添加，例如 华东、华南、长江中下游"
          values={value.distribution}
          onChange={(next) => onChange({ distribution: next })}
        />
        <ChipInput
          label="栖息环境"
          hint="决定卡片属性推断，例如 湿地、稻田、芦苇荡"
          values={value.habitats}
          onChange={(next) => onChange({ habitats: next })}
        />
        <ChipInput
          label="自定义标签"
          hint="用于图鉴筛选，例如 夜行、猛禽、城市公园"
          values={value.tags}
          onChange={(next) => onChange({ tags: next })}
        />
        <Field label="食性">
          <Input value={value.diet} placeholder="以鱼虾、昆虫为主" onChange={(event) => onChange({ diet: event.target.value })} />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-title text-fog-100">四、简介与备注</h3>
        <Field label="中文简介" counter={`${value.summaryZh.length} 字`} hint="详情页展示全文；卡片会自动精简到 90 字以内">
          <Textarea
            rows={7}
            value={value.summaryZh}
            placeholder="记录形态、习性、鸣声、繁殖等观察要点"
            onChange={(event) => onChange({ summaryZh: event.target.value })}
          />
        </Field>
        <Field label="英文简介">
          <Textarea
            rows={5}
            value={value.summaryEn}
            placeholder="English summary from Wikipedia or your own notes"
            onChange={(event) => onChange({ summaryEn: event.target.value })}
          />
        </Field>
        <Field label="拍摄笔记">
          <Textarea
            rows={3}
            value={value.note}
            placeholder="例如：清晨在滩涂蹲守两小时，逆光条件下拍到起飞瞬间"
            onChange={(event) => onChange({ note: event.target.value })}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="鸣声文件路径" hint="本地音频文件，详情页可试听">
            <Input value={value.soundPath} placeholder="D:\\Media\\birds\\egret.mp3" onChange={(event) => onChange({ soundPath: event.target.value })} />
          </Field>
          <Field label="视频文件路径">
            <Input value={value.videoPath} placeholder="D:\\Media\\birds\\egret.mp4" onChange={(event) => onChange({ videoPath: event.target.value })} />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-title text-fog-100">五、收藏状态</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Switch
            checked={value.isFavorite}
            onCheckedChange={(checked) => onChange({ isFavorite: checked })}
            label="加入收藏"
            hint="图鉴墙可一键筛选收藏物种"
          />
          <Switch
            checked={value.isWishlist}
            onCheckedChange={(checked) => onChange({ isWishlist: checked })}
            label="加入想拍清单"
            hint="还没拍到但想记录的物种"
          />
        </div>
        {value.isWishlist ? (
          <Field label="想拍理由">
            <Input
              value={value.wishNote}
              placeholder="例如：湿地保护区冬季有稳定记录"
              onChange={(event) => onChange({ wishNote: event.target.value })}
            />
          </Field>
        ) : null}
      </section>
    </div>
  )
}

interface ChipInputProps {
  label: string
  hint?: string
  values: string[]
  onChange: (values: string[]) => void
}

function ChipInput({ label, hint, values, onChange }: ChipInputProps) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const value = draft.trim()
    if (!value || values.includes(value)) {
      setDraft('')
      return
    }
    onChange([...values, value])
    setDraft('')
  }

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder="输入后回车添加"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commit()
              }
            }}
          />
          <button
            type="button"
            aria-label={`添加${label}`}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line/[0.10] text-fog-200 transition-colors hover:border-moss/60 hover:text-moss"
            onClick={commit}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {values.length ? (
          <div className="flex flex-wrap gap-1.5">
            {values.map((item) => (
              <Badge key={item} tone="neutral" className="gap-1">
                {item}
                <button
                  type="button"
                  aria-label={`移除 ${item}`}
                  className="cursor-pointer text-fog-300 transition-colors hover:text-danger"
                  onClick={() => onChange(values.filter((value) => value !== item))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-micro text-fog-300">暂无内容</span>
        )}
      </div>
    </Field>
  )
}

/** 表单值 → 接口载荷（空字符串转 null，数字字段转数字） */
export function toSpeciesPayload(value: SpeciesFormValue): Record<string, unknown> {
  const text = (input: string) => (input.trim() ? input.trim() : null)
  return {
    cnName: value.cnName.trim(),
    group: value.group,
    scientificName: text(value.scientificName),
    enName: text(value.enName),
    orderName: text(value.orderName),
    familyName: text(value.familyName),
    genusName: text(value.genusName),
    iucnStatus: text(value.iucnStatus),
    iucnYear: value.iucnYear ? Number(value.iucnYear) : null,
    cnProtectionLevel: text(value.cnProtectionLevel),
    cnProtectionSource: text(value.cnProtectionSource),
    isSanyou: value.isSanyou,
    lengthCm: text(value.lengthCm),
    weightG: text(value.weightG),
    wingspanCm: text(value.wingspanCm),
    residenceType: text(value.residenceType),
    ecoType: text(value.ecoType),
    diet: text(value.diet),
    summaryZh: text(value.summaryZh),
    summaryEn: text(value.summaryEn),
    note: text(value.note),
    wishNote: text(value.wishNote),
    soundPath: text(value.soundPath),
    videoPath: text(value.videoPath),
    distribution: value.distribution,
    habitats: value.habitats,
    tags: value.tags,
    isFavorite: value.isFavorite,
    isWishlist: value.isWishlist,
  }
}

/** 已存物种 → 表单值 */
export function toSpeciesFormValue(input: {
  cnName: string
  group: string
  scientificName: string | null
  enName: string | null
  orderName: string | null
  familyName: string | null
  genusName: string | null
  iucnStatus: string | null
  iucnYear: number | null
  cnProtectionLevel: string | null
  cnProtectionSource: string | null
  isSanyou: boolean
  lengthCm: string | null
  weightG: string | null
  wingspanCm: string | null
  residenceType: string | null
  ecoType: string | null
  diet: string | null
  summaryZh: string | null
  summaryEn: string | null
  note: string | null
  wishNote: string | null
  soundPath: string | null
  videoPath: string | null
  distribution: string[]
  habitats: string[]
  tags: string[]
  isFavorite: boolean
  isWishlist: boolean
}): SpeciesFormValue {
  const text = (value: string | null) => value ?? ''
  return {
    cnName: input.cnName,
    group: input.group,
    scientificName: text(input.scientificName),
    enName: text(input.enName),
    orderName: text(input.orderName),
    familyName: text(input.familyName),
    genusName: text(input.genusName),
    iucnStatus: text(input.iucnStatus),
    iucnYear: input.iucnYear ? String(input.iucnYear) : '',
    cnProtectionLevel: text(input.cnProtectionLevel),
    cnProtectionSource: text(input.cnProtectionSource),
    isSanyou: input.isSanyou,
    lengthCm: text(input.lengthCm),
    weightG: text(input.weightG),
    wingspanCm: text(input.wingspanCm),
    residenceType: text(input.residenceType),
    ecoType: text(input.ecoType),
    diet: text(input.diet),
    summaryZh: text(input.summaryZh),
    summaryEn: text(input.summaryEn),
    note: text(input.note),
    wishNote: text(input.wishNote),
    soundPath: text(input.soundPath),
    videoPath: text(input.videoPath),
    distribution: input.distribution,
    habitats: input.habitats,
    tags: input.tags,
    isFavorite: input.isFavorite,
    isWishlist: input.isWishlist,
  }
}
