import './i18n'
import SceneCanvas from './components/Canvas/SceneCanvas'
import Toolbar from './components/UI/Toolbar'
import PropertiesPanel from './components/UI/PropertiesPanel'
import BottomBar from './components/UI/BottomBar'
import RoomMesh from './components/Room/RoomMesh'
import FurnitureItem from './components/Furniture/FurnitureItem'
import { useDesignStore } from './store/designStore'

export default function App() {
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)

  return (
    <div className="w-full h-screen relative overflow-hidden" data-testid="app-root">
      <SceneCanvas>
        {rooms.map(r => (
          <RoomMesh key={r.id} room={r} />
        ))}
        {furniture.map(f => (
          <FurnitureItem key={f.id} item={f} />
        ))}
      </SceneCanvas>
      <Toolbar />
      <PropertiesPanel />
      <BottomBar />
    </div>
  )
}
