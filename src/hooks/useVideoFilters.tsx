
import { useState, useMemo } from "react"
import { VideoFilters as VideoFiltersType } from "@/types/video"
import { VideoWithRelations } from "@/features/videos/types/normalized"

export function useVideoFilters(videos: VideoWithRelations[]) {
  const [filters, setFilters] = useState<VideoFiltersType>({
    search: "",
    configuration_status: "all",
    update_status: "all",
    category_id: "all",
    video_type: "all"
  })

  const [showIgnored, setShowIgnored] = useState(false)

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(filters.search.toLowerCase())
      const matchesConfigStatus = filters.configuration_status === "all" || video.configuration_status === filters.configuration_status
      const matchesUpdateStatus = filters.update_status === "all" || video.update_status === filters.update_status
      const matchesCategory = filters.category_id === "all" || 
        (filters.category_id === "uncategorized" && !video.category_id) ||
        video.category_id === filters.category_id
      const matchesType = filters.video_type === "all" || video.video_type === filters.video_type

      // Se showIgnored for false, esconde vídeos ignorados
      const matchesIgnoreFilter = showIgnored || video.update_status !== 'IGNORED'

      return matchesSearch && matchesConfigStatus && matchesUpdateStatus && matchesCategory && matchesType && matchesIgnoreFilter
    })
  }, [videos, filters, showIgnored])

  return {
    filters,
    setFilters,
    filteredVideos,
    showIgnored,
    setShowIgnored
  }
}
