"use client"

import { useDrop } from "react-dnd"
import { cn } from "@/lib/utils"
import { Piece } from "./piece"

interface SquareProps {
  square: string
  piece: string | null
  isLight: boolean
  isPossibleMove: boolean
  isSelected: boolean
  isInCheck: boolean
  onDropPiece: (from: string, to: string) => void
  onClick: (square: string) => void
}

export const Square = ({
  square,
  piece,
  isLight,
  isPossibleMove,
  isSelected,
  isInCheck,
  onDropPiece,
  onClick,
}: SquareProps) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "piece",
    drop: (item: { piece: string; position: string }) => onDropPiece(item.position, square),
    canDrop: () => true,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }))

  const file = square.charCodeAt(0) - 97
  const rank = Number.parseInt(square[1], 10)

  return (
    <div
      ref={drop}
      onClick={() => onClick(square)}
      className={cn(
        "relative w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200",
        isLight ? "bg-chess-light" : "bg-chess-dark",
        isSelected && "ring-4 ring-yellow-400 ring-inset shadow-lg",
        isInCheck && "bg-red-500/70 animate-pulse",
        isPossibleMove && !isOver && "bg-chess-highlight/70",
        isOver && canDrop && "ring-4 ring-blue-500 ring-inset bg-blue-200/30",
        isOver && !canDrop && "ring-4 ring-red-500 ring-inset",
        "hover:brightness-110",
      )}
    >
      {piece && <Piece piece={piece} position={square} />}

      {/* Indicador visual para movimentos possíveis */}
      {isPossibleMove && !piece && <div className="w-6 h-6 bg-gray-600/60 rounded-full animate-pulse" />}
      {isPossibleMove && piece && (
        <div className="absolute inset-0 border-4 border-red-500/70 rounded-lg animate-pulse" />
      )}

      {/* Coordenadas sutis */}
      {file === 0 && (
        <span className="absolute top-1 left-1 text-xs font-bold text-gray-600/70 bg-white/20 px-1 rounded select-none">
          {rank}
        </span>
      )}
      {rank === 1 && (
        <span className="absolute bottom-1 right-1 text-xs font-bold text-gray-600/70 bg-white/20 px-1 rounded select-none">
          {String.fromCharCode(97 + file)}
        </span>
      )}
    </div>
  )
}
