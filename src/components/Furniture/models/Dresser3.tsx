import Dresser from './Dresser'

/** 3 çekmeceli şifonyer varyantı (tek sütun, 3 satır) */
export default function Dresser3({ dims }: { dims: Record<string, number> }) {
  return <Dresser dims={dims} drawerCount={3} />
}
