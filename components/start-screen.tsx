"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Crown, Zap, Users, Trophy } from "lucide-react"

interface StartScreenProps {
  onStartGame: (playerColor: "white" | "black") => void
}

// Componente para peças animadas no fundo
const AnimatedPiece = ({ piece, delay }: { piece: string; delay: number }) => {
  return (
    <div
      className="absolute text-6xl opacity-10 animate-pulse"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: "3s",
      }}
    >
      {piece}
    </div>
  )
}

// Componente para o tabuleiro de fundo
const BackgroundChessboard = () => {
  const squares = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0
      squares.push(<div key={`${row}-${col}`} className={`w-8 h-8 ${isLight ? "bg-amber-100/5" : "bg-amber-700/5"}`} />)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-20">
      <div className="grid grid-cols-8 gap-0 rotate-12 scale-150">{squares}</div>
    </div>
  )
}

export const StartScreen = ({ onStartGame }: StartScreenProps) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const handlePlay = () => {
    setIsAnimating(true)
    setTimeout(() => {
      onStartGame("white")
    }, 500)
  }

  const pieces = ["♔", "♕", "♖", "♗", "♘", "♙", "♚", "♛", "♜", "♝", "♞", "♟"]

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 overflow-hidden">
      {/* Tabuleiro de fundo */}
      <BackgroundChessboard />

      {/* Peças animadas flutuando */}
      <div className="absolute inset-0 pointer-events-none">
        {pieces.map((piece, index) => (
          <div
            key={index}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${4 + Math.random() * 2}s`,
            }}
          >
            <AnimatedPiece piece={piece} delay={index * 0.2} />
          </div>
        ))}
      </div>

      {/* Conteúdo principal */}
      <div
        className={`relative z-10 transition-all duration-500 ${isAnimating ? "scale-95 opacity-50" : "scale-100 opacity-100"}`}
      >
        {/* Título principal */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent mb-4 animate-pulse">
            ♔ XADREZ ♛
          </h1>
          <p className="text-xl text-gray-300 animate-fade-in">O jogo dos reis e rainhas</p>
        </div>

        {/* Card principal */}
        <Card className="w-full max-w-lg bg-gray-800/90 backdrop-blur-sm text-white border-gray-600 shadow-2xl animate-slide-up">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              Bem-vindo ao Xadrez
              <Crown className="w-8 h-8 text-yellow-400" />
            </CardTitle>
            <p className="text-gray-300 mt-2">Comece a batalha!</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Botão de jogar */}
            <Button
              onClick={handlePlay}
              disabled={isAnimating}
              className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-3">
                {isAnimating ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Jogar
                    <Zap className="w-6 h-6" />
                  </>
                )}
              </div>
            </Button>

            {/* Informações adicionais */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-600">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="text-sm text-gray-300">2 Jogadores</p>
              </div>
              <div className="text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <p className="text-sm text-gray-300">Regras Oficiais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dicas */}
        <div className="mt-8 text-center text-gray-400 text-sm animate-fade-in-delayed">
          <p>💡 Dica: Clique em uma peça para ver seus movimentos possíveis</p>
          <p>🎯 Arraste e solte ou clique para mover as peças</p>
        </div>
      </div>
    </div>
  )
}
