"use client"

import { useState, useCallback } from "react"
import { useDrop, useDrag } from "react-dnd"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { cn } from "@/lib/utils"

// Mapeamento de peças para caracteres Unicode
const PIECE_MAP: { [key: string]: string } = {
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  p: "♟",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
  P: "♙",
}

// Estado inicial do tabuleiro (notação FEN simplificada)
const initialBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
]

// Componente para uma peça de xadrez
interface PieceProps {
  piece: string
  position: [number, number]
  onMove: (from: [number, number], to: [number, number]) => void
}

const Piece = ({ piece, position, onMove }: PieceProps) => {
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
        "w-full h-full flex items-center justify-center text-4xl font-bold cursor-grab",
        isWhite
          ? "text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]"
          : "text-black drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]",
        isDragging ? "opacity-50" : "opacity-100",
      )}
      style={{
        // Adiciona um z-index maior quando arrastando para a peça ficar acima de outras
        zIndex: isDragging ? 100 : 1,
      }}
    >
      {pieceChar}
    </div>
  )
}

// Componente para um quadrado do tabuleiro
interface SquareProps {
  row: number
  col: number
  piece: string | null
  onMove: (from: [number, number], to: [number, number]) => void
}

const Square = ({ row, col, piece, onMove }: SquareProps) => {
  const isLight = (row + col) % 2 === 0
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "piece",
    drop: (item: { piece: string; position: [number, number] }) => onMove(item.position, [row, col]),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }))

  return (
    <div
      ref={drop}
      className={cn(
        "w-full h-full flex items-center justify-center relative",
        isLight ? "bg-amber-100" : "bg-amber-700",
        isOver && canDrop && "ring-4 ring-blue-500 ring-inset", // Destaca o quadrado de destino
        isOver && !canDrop && "ring-4 ring-red-500 ring-inset", // Indica que não pode soltar
      )}
    >
      {piece && <Piece piece={piece} position={[row, col]} onMove={onMove} />}
      {/* Adiciona as coordenadas para depuração ou visualização */}
      <span className="absolute bottom-0 right-0 text-[0.6rem] text-gray-500 opacity-50 p-0.5">
        {String.fromCharCode(97 + col)}
        {8 - row}
      </span>
    </div>
  )
}

// Componente principal do jogo de xadrez
export default function ChessGame() {
  const [board, setBoard] = useState<Array<Array<string | null>>>(initialBoard)

  const handleMove = useCallback((from: [number, number], to: [number, number]) => {
    const [fromRow, fromCol] = from
    const [toRow, toCol] = to

    // Lógica de movimento simplificada: apenas move a peça se o destino estiver vazio
    // ou se for uma peça inimiga (captura simples).
    // Não há validação de movimentos de xadrez aqui (ex: cavalo, bispo, etc.)
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((row) => [...row]) // Cria uma cópia profunda
      const pieceToMove = newBoard[fromRow][fromCol]
      const targetPiece = newBoard[toRow][toCol]

      if (!pieceToMove) return prevBoard // Não há peça para mover

      // Verifica se a peça de destino é do mesmo jogador
      const isSamePlayer = (piece1: string, piece2: string) => {
        if (!piece1 || !piece2) return false
        const isWhite1 = piece1 === piece1.toUpperCase()
        const isWhite2 = piece2 === piece2.toUpperCase()
        return isWhite1 === isWhite2
      }

      if (targetPiece && isSamePlayer(pieceToMove, targetPiece)) {
        return prevBoard // Não permite mover para um quadrado com peça do mesmo jogador
      }

      newBoard[toRow][toCol] = pieceToMove
      newBoard[fromRow][fromCol] = null
      return newBoard
    })
  }, [])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
        <h1 className="text-4xl font-extrabold text-white mb-8 tracking-tight">Chess Game</h1>
        <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[600px] aspect-square border-2 border-gray-700 shadow-2xl rounded-lg overflow-hidden">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => (
              <Square key={`${rowIndex}-${colIndex}`} row={rowIndex} col={colIndex} piece={piece} onMove={handleMove} />
            )),
          )}
        </div>
        <p className="mt-8 text-gray-400 text-sm text-center max-w-md">
          Arraste e solte as peças para movê-las. Esta é uma demonstração da interface; a lógica completa do jogo
          (regras de movimento, xeque, etc.) não está implementada.
        </p>
      </div>
    </DndProvider>
  )
}
