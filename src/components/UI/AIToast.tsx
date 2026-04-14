import { useDesignStore } from '../../store/designStore'

const ROOM_LABELS: Record<string, string> = {
  salon: 'Salon',
  yatak: 'Yatak Odası',
  mutfak: 'Mutfak',
  banyo: 'Banyo',
  koridor: 'Koridor',
  cocuk: 'Çocuk Odası',
}

export default function AIToast() {
  const pending = useDesignStore(s => s.pendingAutoPin)
  const pinToRoom = useDesignStore(s => s.pinToRoom)
  const setPendingAutoPin = useDesignStore(s => s.setPendingAutoPin)
  const rooms = useDesignStore(s => s.rooms)

  if (!pending) return null

  const room = rooms.find(r => r.id === pending.roomId)
  const roomLabel = room ? (ROOM_LABELS[room.type] ?? room.type) : 'Oda'

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50"
      style={{ animation: 'slideUp 0.2s ease-out' }}
    >
      <span className="text-sm whitespace-nowrap">
        Bu mobilyayı <strong>{roomLabel}</strong>'ya sabitle?
      </span>
      <button
        className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
        onClick={() => {
          pinToRoom(pending.furnitureId, pending.roomId)
          setPendingAutoPin(null)
        }}
      >
        Sabitle
      </button>
      <button
        className="bg-gray-600 hover:bg-gray-500 active:bg-gray-400 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
        onClick={() => setPendingAutoPin(null)}
      >
        Hayır
      </button>
    </div>
  )
}
