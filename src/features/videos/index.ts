
// Barrel export for videos feature
export { default as VideosPage } from './pages/VideosPage'
export { useVideos } from './hooks/useVideos'
export { useVideoActions } from './hooks/useVideoActions'
export { useVideoFilters } from './hooks/useVideoFilters'

// Export specialized hooks
export { useVideoCore } from './hooks/useVideoCore'
export { useVideoMetadata } from './hooks/useVideoMetadata'
export { useVideoTranscription } from './hooks/useVideoTranscription'
export { useVideoConfiguration } from './hooks/useVideoConfiguration'

// Export services
export { VideoService } from './services/VideoService'
export { VideoMetadataService } from './services/VideoMetadataService'
export { VideoTranscriptionService } from './services/VideoTranscriptionService'
export { VideoAIService } from './services/VideoAIService'
export { VideoConfigurationService } from './services/VideoConfigurationService'

export * from './types'
export * from './utils'
