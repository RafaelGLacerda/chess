"use client"

import { useDrag } from "react-dnd"
import { cn } from "@/lib/utils"

interface PieceProps {
  piece: string
  position: string
}

// Peças mais modernas e detalhadas
const PIECE_MAP: { [key: string]: string } = {
  r: "♜", // Torre preta
  n: "♞", // Cavalo preto
  b: "♝", // Bispo preto
  q: "♛", // Rainha preta
  k: "♚", // Rei preto
  p: "♟", // Peão preto
  R: "♖", // Torre branca
  N: "♘", // Cavalo branco
  B: "♗", // Bispo branco
  Q: "♕", // Rainha branca
  K: "♔", // Rei branco
  P: "♙", // Peão branco
}

export const Piece = ({ piece, position }: PieceProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "piece",
    item: { piece, position },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  const pieceChar = PIECE_MAP[piece]
  const isWhite = piece === piece.toUpperCase()

  return (
    <div
      ref={drag}
      className={cn(
        "w-full h-full flex items-center justify-center text-6xl font-bold cursor-grab select-none transition-all duration-200",
        isWhite
          ? "text-gray-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
          : "text-gray-800 drop-shadow-[0_2px_4px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_4px_8px_rgba(255,255,255,0.8)]",
        isDragging ? "opacity-50 scale-110" : "opacity-100 hover:scale-105",
        "transform-gpu", // Otimização de performance
      )}
      style={{
        zIndex: isDragging ? 100 : 1,
        filter: isWhite ? "drop-shadow(0 0 2px rgba(0,0,0,0.8))" : "drop-shadow(0 0 2px rgba(255,255,255,0.6))",
      }}
    >
      {pieceChar}
    </div>
  )
}
