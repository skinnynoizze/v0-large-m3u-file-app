interface StatsDisplayProps {
  totalChannels: number
  totalGroups: number
}

export function StatsDisplay({ totalChannels, totalGroups }: StatsDisplayProps) {
  return (
    <div className="flex justify-around p-5 bg-gray-100 my-6 rounded-xl">
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600">{totalChannels.toLocaleString()}</div>
        <div className="text-gray-600">Total Channels</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600">{totalGroups}</div>
        <div className="text-gray-600">Groups</div>
      </div>
    </div>
  )
}
