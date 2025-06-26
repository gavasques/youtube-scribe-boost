
import React from "react"
import { OpenAIServiceCard } from "./Api/OpenAIServiceCard"
import { BitlyServiceCard } from "./Api/BitlyServiceCard"
import { YouTubeServiceCard } from "./Api/YouTubeServiceCard"

export function ApiSettings() {
  return (
    <div className="space-y-6">
      <OpenAIServiceCard />
      <BitlyServiceCard />
      <YouTubeServiceCard />
    </div>
  )
}
