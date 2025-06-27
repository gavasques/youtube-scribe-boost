
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoModal } from "@/components/Videos/VideoModal"
import { VideoFilters } from "@/components/Videos/VideoFilters"
import { YouTubeSyncModal } from "@/components/Videos/YouTubeSyncModal"
import { VideoPreviewModal } from "@/components/Videos/VideoPreviewModal"
import { VideoHeader } from "@/components/Videos/VideoHeader"
import { VideoList } from "@/components/Videos/VideoList/VideoList"
import { SyncProgressCard } from "@/components/Videos/SyncProgressCard"
import { YouTubeQuotaStatus } from "@/components/Videos/YouTubeQuotaStatus"
import { VideoFormData } from "@/types/video"
import { VideoWithRelations } from "@/features/videos/types/normalized"
import { useVideos } from "@/hooks/useVideos"
import { useOptimizedCategories } from "@/hooks/useOptimizedCategories"
import { useVideoFilters } from "@/hooks/useVideoFilters"
import { useVideoActions } from "@/hooks/useVideoActions"
import { useYouTubeSync } from "@/hooks/useYouTubeSync"
import { MassUpdateButton } from "@/components/Videos/MassUpdateButton"

export default function Videos() {
  const { videos, loading: videosLoading, fetchVideos } = useVideos()
  const { categories, loading: categoriesLoading } = useOptimizedCategories()
  const { filters, setFilters, filteredVideos, showIgnored, setShowIgnored } = useVideoFilters(videos as VideoWithRelations[])
  const { 
    handleUpdateStatusToggle, 
    handleEditVideo, 
    handleSaveVideo, 
    handleSyncComplete,
    handleIgnoreVideo,
    handleUnignoreVideo
  } = useVideoActions()
  const { syncing, progress, batchSync, syncWithYouTube, pauseBatchSync, resumeBatchSync, stopBatchSync } = useYouTubeSync()
  
  const [showModal, setShowModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoWithRelations | null>(null)
  const [previewingVideo, setPreviewingVideo] = useState<VideoWithRelations | null>(null)

  const loading = videosLoading || categoriesLoading

  const onEditVideo = async (video: VideoWithRelations) => {
    await handleEditVideo(video)
    setEditingVideo(video)
    setShowModal(true)
  }

  const onSaveVideo = async (data: VideoFormData) => {
    await handleSaveVideo(editingVideo, data)
    setEditingVideo(null)
    setShowModal(false)
  }

  const onCloseModal = () => {
    setShowModal(false)
    setEditingVideo(null)
  }

  const onPreviewVideo = (video: VideoWithRelations) => {
    setPreviewingVideo(video)
    setShowPreviewModal(true)
  }

  const onClosePreviewModal = () => {
    setShowPreviewModal(false)
    setPreviewingVideo(null)
  }

  const onSyncComplete = async () => {
    await handleSyncComplete(videos.length)
    fetchVideos()
    setShowSyncModal(false)
  }

  const onUpdateStatusToggle = (videoId: string, newStatus: string) => {
    handleUpdateStatusToggle(videoId, newStatus, videos as VideoWithRelations[])
  }

  const onIgnoreVideo = async (video: VideoWithRelations) => {
    await handleIgnoreVideo(video)
    fetchVideos()
  }

  const onUnignoreVideo = async (video: VideoWithRelations) => {
    await handleUnignoreVideo(video)
    fetchVideos()
  }

  const handleVideoUpdate = () => {
    fetchVideos()
  }

  return (
    <div className="space-y-6">
      <VideoHeader
        onSyncModal={() => setShowSyncModal(true)}
        onRefresh={fetchVideos}
        extraActions={
          <MassUpdateButton 
            videos={filteredVideos as VideoWithRelations[]}
            onUpdateComplete={handleVideoUpdate}
          />
        }
      />

      {/* YouTube Quota Status */}
      <YouTubeQuotaStatus />

      {/* Mostrar progresso da sincronização se estiver ativa */}
      <SyncProgressCard 
        progress={progress} 
        syncing={syncing}
        batchSync={batchSync}
        onPause={pauseBatchSync}
        onResume={resumeBatchSync}
        onStop={stopBatchSync}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros para encontrar vídeos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
            showIgnored={showIgnored}
            onShowIgnoredChange={setShowIgnored}
          />
        </CardContent>
      </Card>

      <VideoList
        videos={filteredVideos as VideoWithRelations[]}
        loading={loading}
        onEditVideo={onEditVideo}
        onPreviewVideo={onPreviewVideo}
        onUpdateStatusToggle={onUpdateStatusToggle}
        onIgnoreVideo={onIgnoreVideo}
        onUnignoreVideo={onUnignoreVideo}
      />

      <VideoModal
        open={showModal}
        onClose={onCloseModal}
        onSave={onSaveVideo}
        video={editingVideo}
        categories={categories}
        onVideoUpdate={handleVideoUpdate}
      />

      <YouTubeSyncModal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSyncComplete={onSyncComplete}
      />

      <VideoPreviewModal
        open={showPreviewModal}
        onClose={onClosePreviewModal}
        video={previewingVideo}
      />
    </div>
  )
}
