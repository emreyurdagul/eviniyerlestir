import Dresser from './Dresser'

/** 6 çekmeceli şifonyer varyantı (2 sütun, 3 satır) */
export default function Dresser6({ dims }: { dims: Record<string, number> }) {
  return <Dresser dims={dims} drawerCount={6} />
}
