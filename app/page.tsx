"use client"

import { useState } from "react"
import { ChessBoard } from "@/components/chess-board"
import { StartScreen } from "@/components/start-screen"

export default function HomePage() {
  const [gameStarted, setGameStarted] = useState(false)
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white")

  const handleStartGame = (color: "white" | "black") => {
    setPlayerColor(color)
    setGameStarted(true)
  }

  const handleRestartGame = () => {
    // Mantém na tela do jogo, apenas reinicia
    // setGameStarted permanece true
  }

  const handleBackToStart = () => {
    // Volta para a tela inicial
    setGameStarted(false)
    setPlayerColor("white")
  }

  return (
    <main>
      {!gameStarted && <StartScreen onStartGame={handleStartGame} />}
      {gameStarted && (
        <ChessBoard playerColor={playerColor} onRestartGame={handleRestartGame} onBackToStart={handleBackToStart} />
      )}
    </main>
  )
}
