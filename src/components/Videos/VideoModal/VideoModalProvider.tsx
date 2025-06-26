
import React, { createContext, useContext, useState } from 'react'
import { Video } from '@/types/video'

interface VideoModalContextType {
  video: Video | null
  setVideo: (video: Video | null) => void
  isSubmitting: boolean
  setIsSubmitting: (submitting: boolean) => void
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
}

const VideoModalContext = createContext<VideoModalContextType | null>(null)

export function useVideoModal() {
  const context = useContext(VideoModalContext)
  if (!context) {
    throw new Error('useVideoModal must be used within VideoModalProvider')
  }
  return context
}

interface VideoModalProviderProps {
  children: React.ReactNode
  initialVideo?: Video | null
}

export function VideoModalProvider({ children, initialVideo = null }: VideoModalProviderProps) {
  const [video, setVideo] = useState<Video | null>(initialVideo)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const value = {
    video,
    setVideo,
    isSubmitting,
    setIsSubmitting,
    isDirty,
    setIsDirty
  }

  return (
    <VideoModalContext.Provider value={value}>
      {children}
    </VideoModalContext.Provider>
  )
}
