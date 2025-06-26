
import { MetricCard } from "./MetricCard"
import { Play, Blocks, Folder, Clock, EyeOff } from "lucide-react"
import { METRIC_COLORS, DASHBOARD_METRICS } from "@/utils/dashboardConstants"
import { formatMetricDescription } from "@/utils/dashboardFormatters"

interface DashboardStatsProps {
  stats: {
    totalVideos: number
    activeBlocks: number
    categories: number
    pendingVideos: number
    ignoredVideos: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const metrics = [
    {
      title: "Total de Vídeos",
      value: stats.totalVideos,
      description: formatMetricDescription('total_videos', stats.totalVideos),
      icon: Play,
      className: `${METRIC_COLORS[DASHBOARD_METRICS.TOTAL_VIDEOS].border} ${METRIC_COLORS[DASHBOARD_METRICS.TOTAL_VIDEOS].gradient}`
    },
    {
      title: "Blocos Ativos",
      value: stats.activeBlocks,
      description: formatMetricDescription('active_blocks', stats.activeBlocks),
      icon: Blocks,
      className: `${METRIC_COLORS[DASHBOARD_METRICS.ACTIVE_BLOCKS].border} ${METRIC_COLORS[DASHBOARD_METRICS.ACTIVE_BLOCKS].gradient}`
    },
    {
      title: "Categorias Criadas",
      value: stats.categories,
      description: formatMetricDescription('categories', stats.categories),
      icon: Folder,
      className: `${METRIC_COLORS[DASHBOARD_METRICS.CATEGORIES].border} ${METRIC_COLORS[DASHBOARD_METRICS.CATEGORIES].gradient}`
    },
    {
      title: "Vídeos Pendentes",
      value: stats.pendingVideos,
      description: formatMetricDescription('pending_videos', stats.pendingVideos),
      icon: Clock,
      className: `${METRIC_COLORS[DASHBOARD_METRICS.PENDING_VIDEOS].border} ${METRIC_COLORS[DASHBOARD_METRICS.PENDING_VIDEOS].gradient}`
    },
    {
      title: "Vídeos Ignorados",
      value: stats.ignoredVideos,
      description: formatMetricDescription('ignored_videos', stats.ignoredVideos),
      icon: EyeOff,
      className: `${METRIC_COLORS[DASHBOARD_METRICS.IGNORED_VIDEOS].border} ${METRIC_COLORS[DASHBOARD_METRICS.IGNORED_VIDEOS].gradient}`
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          description={metric.description}
          icon={metric.icon}
          className={metric.className}
        />
      ))}
    </div>
  )
}
