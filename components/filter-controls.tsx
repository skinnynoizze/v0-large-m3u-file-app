"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { ChannelGroup } from "@/lib/types"

interface FilterControlsProps {
  groups: ChannelGroup[]
  searchTerm: string
  selectedGroup: string
  onSearchChange: (value: string) => void
  onGroupChange: (value: string) => void
  onClearFilters?: () => void
}

export function FilterControls({
  groups,
  searchTerm,
  selectedGroup,
  onSearchChange,
  onGroupChange,
  onClearFilters,
}: FilterControlsProps) {
  const hasActiveFilters = searchTerm || selectedGroup

  return (
    <div className="flex flex-wrap gap-4 mb-8 items-end">
      <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
        <Label htmlFor="searchTitle" className="font-semibold text-gray-700">
          Search by title:
        </Label>
        <Input
          id="searchTitle"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-2 border-gray-200 rounded-lg"
        />
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
        <Label htmlFor="groupFilter" className="font-semibold text-gray-700">
          Filter by group:
        </Label>
        <Select value={selectedGroup} onValueChange={onGroupChange}>
          <SelectTrigger id="groupFilter" className="border-2 border-gray-200 rounded-lg">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.title} value={group.title}>
                {group.title} ({group.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && onClearFilters && (
        <div className="flex flex-col gap-2">
          <Label className="font-semibold text-gray-700 opacity-0">Clear</Label>
          <Button variant="outline" onClick={onClearFilters} className="border-2 border-gray-200 rounded-lg">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
