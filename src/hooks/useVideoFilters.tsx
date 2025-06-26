
import { useState, useMemo } from "react"
import { VideoFilters as VideoFiltersType, Video } from "@/types/video"

export function useVideoFilters(videos: Video[]) {
  const [filters, setFilters] = useState<VideoFiltersType>({
    search: "",
    configuration_status: "all",
    update_status: "all",
    category_id: "all",
    video_type: "all"
  })

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(filters.search.toLowerCase())
      const matchesConfigStatus = filters.configuration_status === "all" || video.configuration_status === filters.configuration_status
      const matchesUpdateStatus = filters.update_status === "all" || video.update_status === filters.update_status
      const matchesCategory = filters.category_id === "all" || 
        (filters.category_id === "uncategorized" && !video.category_id) ||
        video.category_id === filters.category_id
      const matchesType = filters.video_type === "all" || video.video_type === filters.video_type

      return matchesSearch && matchesConfigStatus && matchesUpdateStatus && matchesCategory && matchesType
    })
  }, [videos, filters])

  return {
    filters,
    setFilters,
    filteredVideos
  }
}
