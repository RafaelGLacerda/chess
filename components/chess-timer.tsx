"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChessTimerProps {
  whiteTime: number
  blackTime: number
  currentTurn: "w" | "b"
  isGameActive: boolean
  onTimeUp: (color: "white" | "black") => void
}

export const ChessTimer = ({ whiteTime, blackTime, currentTurn, isGameActive, onTimeUp }: ChessTimerProps) => {
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getTimeColor = (time: number, isActive: boolean) => {
    if (time <= 30) return "text-red-400" // Últimos 30 segundos
    if (time <= 60) return "text-yellow-400" // Último minuto
    if (isActive) return "text-green-400" // Jogador ativo
    return "text-gray-300" // Jogador inativo
  }

  const getCardStyle = (isActive: boolean, time: number) => {
    let baseStyle = "transition-all duration-300 "

    if (isActive && isGameActive) {
      baseStyle += "ring-2 ring-green-400 bg-gray-700/90 "
      if (time <= 30) {
        baseStyle += "animate-pulse ring-red-400 "
      }
    } else {
      baseStyle += "bg-gray-800/90 "
    }

    return baseStyle
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      {/* Timer das Pretas */}
      <Card className={cn("border-gray-600", getCardStyle(currentTurn === "b", blackTime))}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-800 rounded-full border-2 border-gray-400"></div>
              <span className="font-semibold text-gray-200">Pretas</span>
            </div>
            <div className="flex items-center gap-2">
              {currentTurn === "b" && isGameActive && <Clock className="w-4 h-4 text-green-400 animate-spin" />}
              {blackTime <= 30 && isGameActive && <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />}
            </div>
          </div>
          <div className={cn("text-3xl font-mono font-bold mt-2", getTimeColor(blackTime, currentTurn === "b"))}>
            {formatTime(blackTime)}
          </div>
        </CardContent>
      </Card>

      {/* Timer das Brancas */}
      <Card className={cn("border-gray-600", getCardStyle(currentTurn === "w", whiteTime))}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white rounded-full border-2 border-gray-400"></div>
              <span className="font-semibold text-gray-200">Brancas</span>
            </div>
            <div className="flex items-center gap-2">
              {currentTurn === "w" && isGameActive && <Clock className="w-4 h-4 text-green-400 animate-spin" />}
              {whiteTime <= 30 && isGameActive && <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />}
            </div>
          </div>
          <div className={cn("text-3xl font-mono font-bold mt-2", getTimeColor(whiteTime, currentTurn === "w"))}>
            {formatTime(whiteTime)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
