interface StatsDisplayProps {
  totalChannels: number
  totalGroups: number
}

export function StatsDisplay({ totalChannels, totalGroups }: StatsDisplayProps) {
  return (
    <div className="flex items-center space-x-3 text-sm text-gray-500">
      <span>{totalChannels.toLocaleString()} channels</span>
      <span>·</span>
      <span>{totalGroups} groups</span>
    </div>
  )
}
