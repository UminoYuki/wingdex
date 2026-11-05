import { Suspense, lazy } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { AppShell } from './components/AppShell'
import { AchievementWatcher } from './components/AchievementWatcher'
import { Lightbox } from './components/Lightbox'
import { QuickCreateDialog } from './components/QuickCreateDialog'
import { EmptyState, SkeletonRows } from './components/ui'
import AtlasPage from './pages/AtlasPage'
import InboxPage from './pages/InboxPage'
import SpeciesEditPage from './pages/SpeciesEditPage'
import SpeciesPage from './pages/SpeciesPage'
import StatsPage from './pages/StatsPage'
import MapPage from './pages/MapPage'
import AchievementsPage from './pages/AchievementsPage'
import WishlistPage from './pages/WishlistPage'
import CardsPage from './pages/CardsPage'
import CardDetailPage from './pages/CardDetailPage'
import SettingsPage from './pages/SettingsPage'

/** 卡片编辑器与离屏打印路由体积较大，按需加载 */
const CardEditorPage = lazy(() => import('./editor/CardEditorPage'))
const CardPrintPage = lazy(() => import('./pages/CardPrintPage'))

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/cards/print/:id"
          element={
            <Suspense fallback={null}>
              <CardPrintPage />
            </Suspense>
          }
        />

        <Route
          path="/cards/editor/:id"
          element={
            <AppShell variant="canvas">
              <Suspense fallback={<SkeletonRows count={6} className="px-6 pt-6" />}>
                <CardEditorPage />
              </Suspense>
            </AppShell>
          }
        />

        <Route
          path="*"
          element={
            <AppShell>
              <Routes>
                <Route path="/" element={<AtlasPage />} />
                <Route path="/species/new" element={<SpeciesEditPage />} />
                <Route path="/species/:id/edit" element={<SpeciesEditPage />} />
                <Route path="/species/:id" element={<SpeciesPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/cards" element={<CardsPage />} />
                <Route path="/cards/:id" element={<CardDetailPage />} />
                <Route path="/cards/editor/:id" element={<CardEditorPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>

      <Lightbox />
      <QuickCreateDialog />
      <AchievementWatcher />
    </>
  )
}

function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <EmptyState
      icon={<Compass className="h-6 w-6 text-fog-300" />}
      title="这里没有鸟迹"
      description="页面可能已被移动，回到图鉴墙继续翻看你的收藏吧。"
      action={{ label: '返回图鉴墙', onClick: () => navigate('/') }}
      secondaryAction={{ label: '去导入照片', onClick: () => navigate('/inbox') }}
    />
  )
}
