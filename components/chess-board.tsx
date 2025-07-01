"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Chess } from "chess.js"
import { Square } from "./square"
import { ChessTimer } from "./chess-timer"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Crown,
  Shield,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Trophy,
  Home,
  Play,
  Timer,
} from "lucide-react"

interface ChessBoardProps {
  playerColor: "white" | "black"
  onRestartGame: () => void
  onBackToStart: () => void
}

// Valores das peças para pontuação
const PIECE_VALUES: { [key: string]: number } = {
  p: 1, // Peão
  n: 3, // Cavalo
  b: 3, // Bispo
  r: 5, // Torre
  q: 9, // Rainha
  k: 0, // Rei (não conta para pontuação)
}

// Mapeamento de peças para caracteres Unicode
const PIECE_UNICODE: { [key: string]: string } = {
  p: "♟", // Peão preto
  n: "♞", // Cavalo preto
  b: "♝", // Bispo preto
  r: "♜", // Torre preta
  q: "♛", // Rainha preta
  k: "♚", // Rei preto
  P: "♙", // Peão branco
  N: "♘", // Cavalo branco
  B: "♗", // Bispo branco
  R: "♖", // Torre branca
  Q: "♕", // Rainha branca
  K: "♔", // Rei branco
}

export const ChessBoard = ({ playerColor, onRestartGame, onBackToStart }: ChessBoardProps) => {
  // Inicializar o jogo diretamente
  const [game, setGame] = useState(() => new Chess())
  const [gameKey, setGameKey] = useState(0) // Chave para forçar re-render
  const [board, setBoard] = useState(() => new Chess().board())
  const [status, setStatus] = useState("Vez das Brancas")
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [gameHistory, setGameHistory] = useState<any[]>([])
  const [isInCheck, setIsInCheck] = useState(false)
  const [checkSquare, setCheckSquare] = useState<string | null>(null)
  const [invalidMoveMessage, setInvalidMoveMessage] = useState<string | null>(null)
  const [gameEndReason, setGameEndReason] = useState<string | null>(null)
  const [winner, setWinner] = useState<string | null>(null)

  // Estados para navegação do histórico
  const [viewingHistoryIndex, setViewingHistoryIndex] = useState<number | null>(null)
  const [displayGame, setDisplayGame] = useState(() => new Chess())

  // Estados do cronômetro
  const [whiteTime, setWhiteTime] = useState(300)
  const [blackTime, setBlackTime] = useState(300)
  const [isGameActive, setIsGameActive] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Estados de captura e pontuação
  const [capturedPieces, setCapturedPieces] = useState<{
    white: string[]
    black: string[]
  }>({ white: [], black: [] })
  const [materialScore, setMaterialScore] = useState<{
    white: number
    black: number
  }>({ white: 0, black: 0 })

  const initializeGame = useCallback(() => {
    console.log("Inicializando novo jogo...")

    // Limpar timer existente
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Criar nova instância do jogo
    const newGame = new Chess()
    const newDisplayGame = new Chess()

    // Atualizar todos os estados de uma vez
    setGame(newGame)
    setDisplayGame(newDisplayGame)
    setBoard(newGame.board())
    setGameKey((prev) => prev + 1) // Força re-render completo

    // Resetar todos os estados
    setSelectedSquare(null)
    setPossibleMoves([])
    setIsInCheck(false)
    setCheckSquare(null)
    setInvalidMoveMessage(null)
    setGameEndReason(null)
    setWinner(null)
    setGameHistory([])
    setViewingHistoryIndex(null)
    setStatus("Vez das Brancas")

    // Resetar cronômetros
    setWhiteTime(300)
    setBlackTime(300)
    setIsGameActive(true)

    // Resetar capturas e pontuação
    setCapturedPieces({ white: [], black: [] })
    setMaterialScore({ white: 0, black: 0 })

    console.log("Jogo inicializado com sucesso")
  }, [])

  // Cronômetro
  useEffect(() => {
    if (!isGameActive || gameEndReason || viewingHistoryIndex !== null) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            handleTimeUp("white")
            return 0
          }
          return prev - 1
        })
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            handleTimeUp("black")
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [game.turn(), isGameActive, gameEndReason, viewingHistoryIndex])

  const handleTimeUp = useCallback((color: "white" | "black") => {
    const winnerSide = color === "white" ? "Pretas" : "Brancas"
    setStatus(`Tempo esgotado! ${winnerSide} venceram!`)
    setGameEndReason("Tempo esgotado")
    setWinner(winnerSide)
    setIsGameActive(false)
  }, [])

  const calculateMaterialAdvantage = useCallback((capturedByWhite: string[], capturedByBlack: string[]) => {
    const whitePoints = capturedByWhite.reduce((sum, piece) => sum + (PIECE_VALUES[piece.toLowerCase()] || 0), 0)
    const blackPoints = capturedByBlack.reduce((sum, piece) => sum + (PIECE_VALUES[piece.toLowerCase()] || 0), 0)

    return {
      white: whitePoints,
      black: blackPoints,
      advantage: whitePoints - blackPoints,
    }
  }, [])

  const updateBoard = useCallback(() => {
    const currentGame = viewingHistoryIndex !== null ? displayGame : game

    setBoard(currentGame.board())
    const history = game.history({ verbose: true })
    setGameHistory(history)
    setIsInCheck(currentGame.inCheck())

    // Calcular peças capturadas
    const captured = { white: [], black: [] }
    history.forEach((move: any) => {
      if (move.captured) {
        if (move.color === "w") {
          // Brancas capturaram uma peça preta
          captured.white.push(move.captured)
        } else {
          // Pretas capturaram uma peça branca
          captured.black.push(move.captured.toUpperCase())
        }
      }
    })

    setCapturedPieces(captured)
    const materialCalc = calculateMaterialAdvantage(captured.white, captured.black)
    setMaterialScore(materialCalc)

    // Encontra a posição do rei em xeque
    if (currentGame.inCheck()) {
      const kingSquare = findKingSquare(currentGame.turn())
      setCheckSquare(kingSquare)
    } else {
      setCheckSquare(null)
    }

    // Só atualiza status do jogo se não estiver navegando no histórico
    if (viewingHistoryIndex === null) {
      let gameStatus = ""
      let endReason = null
      let gameWinner = null

      if (game.isCheckmate()) {
        const winnerSide = game.turn() === "w" ? "Pretas" : "Brancas"
        gameStatus = `Xeque-mate! ${winnerSide} venceram!`
        endReason = "Xeque-mate"
        gameWinner = winnerSide
        setIsGameActive(false)
      } else if (game.isStalemate()) {
        gameStatus = "Empate por afogamento!"
        endReason = "Afogamento"
        setIsGameActive(false)
      } else if (game.isThreefoldRepetition()) {
        gameStatus = "Empate por repetição tripla!"
        endReason = "Repetição tripla"
        setIsGameActive(false)
      } else if (game.isInsufficientMaterial()) {
        gameStatus = "Empate por material insuficiente!"
        endReason = "Material insuficiente"
        setIsGameActive(false)
      } else if (game.isDraw()) {
        gameStatus = "Empate!"
        endReason = "Empate"
        setIsGameActive(false)
      } else if (game.isGameOver()) {
        gameStatus = "Fim de jogo!"
        endReason = "Fim de jogo"
        setIsGameActive(false)
      } else {
        const currentPlayer = game.turn() === "w" ? "Brancas" : "Pretas"
        if (game.inCheck()) {
          gameStatus = `${currentPlayer} em XEQUE!`
        } else {
          gameStatus = `Vez das ${currentPlayer}`
        }
      }

      setStatus(gameStatus)
      setGameEndReason(endReason)
      setWinner(gameWinner)
    } else {
      // Navegando no histórico
      setStatus(`Visualizando lance ${viewingHistoryIndex + 1} de ${gameHistory.length}`)
    }
  }, [game, displayGame, viewingHistoryIndex, gameHistory.length, calculateMaterialAdvantage])

  const findKingSquare = (color: "w" | "b"): string | null => {
    const currentGame = viewingHistoryIndex !== null ? displayGame : game
    const board = currentGame.board()
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece && piece.type === "k" && piece.color === color) {
          return `${String.fromCharCode(97 + col)}${8 - row}`
        }
      }
    }
    return null
  }

  // Navegação do histórico
  const navigateToMove = useCallback(
    (moveIndex: number | null) => {
      if (moveIndex === null) {
        // Voltar ao jogo atual
        setViewingHistoryIndex(null)
        setDisplayGame(new Chess(game.fen()))
        setSelectedSquare(null)
        setPossibleMoves([])
      } else {
        // Navegar para um movimento específico
        const tempGame = new Chess()
        const moves = game.history()

        for (let i = 0; i <= moveIndex; i++) {
          tempGame.move(moves[i])
        }

        setViewingHistoryIndex(moveIndex)
        setDisplayGame(tempGame)
        setSelectedSquare(null)
        setPossibleMoves([])
      }
      updateBoard()
    },
    [game, updateBoard],
  )

  // Controle por teclado
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Só funciona se houver histórico
      if (gameHistory.length === 0) return

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          const prevIndex = viewingHistoryIndex === null ? gameHistory.length - 1 : Math.max(viewingHistoryIndex - 1, 0)
          navigateToMove(prevIndex)
          break

        case "ArrowRight":
          event.preventDefault()
          if (viewingHistoryIndex === null) return
          if (viewingHistoryIndex >= gameHistory.length - 1) {
            navigateToMove(null)
          } else {
            navigateToMove(viewingHistoryIndex + 1)
          }
          break

        case "Home":
          event.preventDefault()
          navigateToMove(0)
          break

        case "End":
          event.preventDefault()
          navigateToMove(null)
          break

        case "Escape":
          event.preventDefault()
          if (viewingHistoryIndex !== null) {
            navigateToMove(null)
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [gameHistory.length, viewingHistoryIndex, navigateToMove])

  useEffect(() => {
    updateBoard()
  }, [updateBoard])

  const handleRestartInternal = useCallback(() => {
    console.log("Reiniciando jogo...")
    initializeGame()
    onRestartGame()
  }, [initializeGame, onRestartGame])

  const handleSquareClick = useCallback(
    (square: string) => {
      if (viewingHistoryIndex !== null || gameEndReason) return

      setInvalidMoveMessage(null)
      const piece = game.get(square)

      if (selectedSquare) {
        try {
          const move = game.move({ from: selectedSquare, to: square, promotion: "q" })
          if (move) {
            updateBoard()
            setSelectedSquare(null)
            setPossibleMoves([])
          } else {
            setInvalidMoveMessage(`Movimento inválido: ${selectedSquare} → ${square}`)
            if (piece && piece.color === game.turn()) {
              setSelectedSquare(square)
              const moves = game.moves({ square: square, verbose: true })
              setPossibleMoves(moves.map((m) => m.to))
            } else {
              setSelectedSquare(null)
              setPossibleMoves([])
            }
          }
        } catch (error) {
          setInvalidMoveMessage(`Movimento ilegal`)
          setSelectedSquare(null)
          setPossibleMoves([])
        }
      } else {
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square)
          const moves = game.moves({ square: square, verbose: true })
          setPossibleMoves(moves.map((m) => m.to))
        } else if (piece && piece.color !== game.turn()) {
          setInvalidMoveMessage(`Não é sua vez! É a vez das ${game.turn() === "w" ? "Brancas" : "Pretas"}`)
        }
      }
    },
    [game, selectedSquare, updateBoard, viewingHistoryIndex, gameEndReason],
  )

  const handleDropPiece = useCallback(
    (from: string, to: string) => {
      if (viewingHistoryIndex !== null || gameEndReason) return

      setInvalidMoveMessage(null)

      try {
        const move = game.move({ from, to, promotion: "q" })
        if (move) {
          updateBoard()
          setSelectedSquare(null)
          setPossibleMoves([])
        } else {
          setInvalidMoveMessage(`Movimento inválido: ${from} → ${to}`)
        }
      } catch (error) {
        setInvalidMoveMessage(`Movimento ilegal`)
      }
    },
    [game, updateBoard, viewingHistoryIndex, gameEndReason],
  )

  const getGameStatusIcon = () => {
    if (gameEndReason === "Xeque-mate") return <Crown className="w-5 h-5" />
    if (gameEndReason === "Tempo esgotado") return <Timer className="w-5 h-5" />
    if (isInCheck) return <AlertTriangle className="w-5 h-5" />
    if (gameEndReason) return <Shield className="w-5 h-5" />
    if (viewingHistoryIndex !== null) return <Clock className="w-5 h-5" />
    return <Clock className="w-5 h-5" />
  }

  const getGameStatusColor = () => {
    if (gameEndReason === "Xeque-mate") return "text-yellow-400"
    if (gameEndReason === "Tempo esgotado") return "text-red-400"
    if (isInCheck) return "text-red-400"
    if (gameEndReason) return "text-blue-400"
    if (viewingHistoryIndex !== null) return "text-purple-400"
    return "text-white"
  }

  return (
    <DndProvider backend={HTML5Backend} key={gameKey}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <h1 className="text-4xl font-extrabold text-white mb-8 tracking-tight">Jogo de Xadrez</h1>

        {/* Animação de vitória */}
        {winner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-8 rounded-2xl shadow-2xl text-center animate-bounce max-w-md">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-900" />
              <h2 className="text-4xl font-bold text-yellow-900 mb-2">🎉 VITÓRIA! 🎉</h2>
              <p className="text-2xl text-yellow-800 mb-2">{winner} venceram!</p>
              <p className="text-lg text-yellow-700 mb-6">Por {gameEndReason}</p>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleRestartInternal}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2"
                >
                  <Play className="w-4 h-4" />
                  Jogar Novamente
                </Button>
                <Button
                  onClick={onBackToStart}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2"
                >
                  <Home className="w-4 h-4" />
                  Tela Inicial
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empate */}
        {gameEndReason && !winner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-8 rounded-2xl shadow-2xl text-center animate-bounce max-w-md">
              <Shield className="w-16 h-16 mx-auto mb-4 text-blue-900" />
              <h2 className="text-4xl font-bold text-blue-900 mb-2">🤝 EMPATE! 🤝</h2>
              <p className="text-lg text-blue-700 mb-6">{gameEndReason}</p>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleRestartInternal}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2"
                >
                  <Play className="w-4 h-4" />
                  Jogar Novamente
                </Button>
                <Button
                  onClick={onBackToStart}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2"
                >
                  <Home className="w-4 h-4" />
                  Tela Inicial
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status do jogo */}
        <Card className="mb-6 bg-gray-800/90 backdrop-blur-sm border-gray-700">
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-2 text-xl font-semibold", getGameStatusColor())}>
              {getGameStatusIcon()}
              {status}
              {viewingHistoryIndex !== null && (
                <Button
                  onClick={() => navigateToMove(null)}
                  size="sm"
                  className="ml-4 bg-purple-600 hover:bg-purple-700"
                >
                  Voltar ao jogo atual
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {isInCheck && !gameEndReason && viewingHistoryIndex === null && (
          <Alert className="mb-4 max-w-md bg-yellow-900/90 backdrop-blur-sm border-yellow-700 text-yellow-100 animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>XEQUE! O rei está sob ataque!</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col xl:flex-row gap-6 w-full max-w-7xl">
          {/* Painel esquerdo - Cronômetros e Peças Capturadas */}
          <div className="flex flex-col gap-4 w-full xl:w-80">
            {/* Cronômetros */}
            <ChessTimer
              whiteTime={whiteTime}
              blackTime={blackTime}
              currentTurn={game.turn()}
              isGameActive={isGameActive && viewingHistoryIndex === null}
              onTimeUp={handleTimeUp}
            />

            {/* Peças Capturadas e Pontuação */}
            <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Material Capturado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pretas (capturadas pelas brancas) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Brancas capturaram:</span>
                    <span className="text-sm font-bold text-green-400">+{materialScore.white}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[32px] bg-gray-700/50 rounded p-2">
                    {capturedPieces.white.map((piece, index) => (
                      <span key={index} className="text-lg">
                        {PIECE_UNICODE[piece]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Brancas (capturadas pelas pretas) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Pretas capturaram:</span>
                    <span className="text-sm font-bold text-green-400">+{materialScore.black}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[32px] bg-gray-700/50 rounded p-2">
                    {capturedPieces.black.map((piece, index) => (
                      <span key={index} className="text-lg">
                        {PIECE_UNICODE[piece]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vantagem Material */}
                {materialScore.advantage !== 0 && (
                  <div className="text-center pt-2 border-t border-gray-600">
                    <span className="text-sm">
                      {materialScore.advantage > 0 ? "Brancas" : "Pretas"} +{Math.abs(materialScore.advantage)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabuleiro Central */}
          <div className="flex-1 flex flex-col items-center">
            {/* Coordenadas superiores */}
            <div className="flex mb-2">
              {["a", "b", "c", "d", "e", "f", "g", "h"].map((file, index) => (
                <div key={file} className="w-[75px] text-center text-white font-bold text-lg">
                  {playerColor === "white" ? file : ["h", "g", "f", "e", "d", "c", "b", "a"][index]}
                </div>
              ))}
            </div>

            <div className="flex">
              {/* Coordenadas laterais esquerdas */}
              <div className="flex flex-col mr-2">
                {[8, 7, 6, 5, 4, 3, 2, 1].map((rank, index) => (
                  <div key={rank} className="h-[75px] flex items-center text-white font-bold text-lg">
                    {playerColor === "white" ? rank : [1, 2, 3, 4, 5, 6, 7, 8][index]}
                  </div>
                ))}
              </div>

              {/* Tabuleiro */}
              <div className="grid grid-cols-8 grid-rows-8 w-[600px] h-[600px] border-4 border-gray-700 shadow-2xl rounded-lg overflow-hidden">
                {board.map((row, rowIndex) => (
                  <div key={rowIndex} className="contents">
                    {row.map((piece, colIndex) => {
                      const actualRow = playerColor === "white" ? rowIndex : 7 - rowIndex
                      const actualCol = playerColor === "white" ? colIndex : 7 - colIndex
                      const squareName = `${String.fromCharCode(97 + actualCol)}${8 - actualRow}`
                      const isLight = (actualRow + actualCol) % 2 === 0
                      const isPossibleMove = possibleMoves.includes(squareName) && viewingHistoryIndex === null
                      const isSelected = selectedSquare === squareName && viewingHistoryIndex === null
                      const isKingInCheck = checkSquare === squareName

                      let pieceChar = null
                      if (piece) {
                        pieceChar = piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase()
                      }

                      return (
                        <Square
                          key={squareName}
                          square={squareName}
                          piece={pieceChar}
                          isLight={isLight}
                          isPossibleMove={isPossibleMove}
                          isSelected={isSelected}
                          isInCheck={isKingInCheck}
                          onDropPiece={handleDropPiece}
                          onClick={handleSquareClick}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Coordenadas laterais direitas */}
              <div className="flex flex-col ml-2">
                {[8, 7, 6, 5, 4, 3, 2, 1].map((rank, index) => (
                  <div key={rank} className="h-[75px] flex items-center text-white font-bold text-lg">
                    {playerColor === "white" ? rank : [1, 2, 3, 4, 5, 6, 7, 8][index]}
                  </div>
                ))}
              </div>
            </div>

            {/* Coordenadas inferiores */}
            <div className="flex mt-2">
              {["a", "b", "c", "d", "e", "f", "g", "h"].map((file, index) => (
                <div key={file} className="w-[75px] text-center text-white font-bold text-lg">
                  {playerColor === "white" ? file : ["h", "g", "f", "e", "d", "c", "b", "a"][index]}
                </div>
              ))}
            </div>

            {/* Controles de navegação */}
            {gameHistory.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={() => navigateToMove(null)}
                  disabled={viewingHistoryIndex === null}
                  size="sm"
                  className="bg-gray-600 hover:bg-gray-700"
                  title="Ir para o final (End)"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() =>
                    navigateToMove(
                      viewingHistoryIndex === null
                        ? null
                        : viewingHistoryIndex >= gameHistory.length - 1
                          ? null
                          : viewingHistoryIndex + 1,
                    )
                  }
                  disabled={viewingHistoryIndex === null}
                  size="sm"
                  className="bg-gray-600 hover:bg-gray-700"
                  title="Próximo movimento (→)"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-white text-sm px-2">
                  {viewingHistoryIndex !== null
                    ? `${viewingHistoryIndex + 1}/${gameHistory.length}`
                    : `${gameHistory.length}/${gameHistory.length}`}
                </span>
                <Button
                  onClick={() =>
                    navigateToMove(
                      viewingHistoryIndex === null ? gameHistory.length - 1 : Math.max(viewingHistoryIndex - 1, 0),
                    )
                  }
                  disabled={viewingHistoryIndex === 0}
                  size="sm"
                  className="bg-gray-600 hover:bg-gray-700"
                  title="Movimento anterior (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => navigateToMove(0)}
                  disabled={viewingHistoryIndex === 0}
                  size="sm"
                  className="bg-gray-600 hover:bg-gray-700"
                  title="Ir para o início (Home)"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Button
              onClick={handleRestartInternal}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-3"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Jogo
            </Button>

            {/* Mensagem de erro */}
            {invalidMoveMessage && (
              <Alert className="mt-4 max-w-md bg-red-900/90 backdrop-blur-sm border-red-700 text-red-100 animate-shake">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{invalidMoveMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Painel direito - Histórico */}
          <div className="w-full xl:w-80">
            <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 text-white h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Histórico de Movimentos</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2">
                  <div className="grid grid-cols-3 gap-1 text-sm">
                    {/* Cabeçalho */}
                    <div className="font-bold text-gray-400 text-center">#</div>
                    <div className="font-bold text-gray-400 text-center">Brancas</div>
                    <div className="font-bold text-gray-400 text-center">Pretas</div>

                    {/* Movimentos */}
                    {Array.from({ length: Math.ceil(gameHistory.length / 2) }, (_, i) => {
                      const whiteMove = gameHistory[i * 2]
                      const blackMove = gameHistory[i * 2 + 1]

                      return (
                        <div key={i} className="contents">
                          <div className="text-center text-gray-400 py-1">{i + 1}</div>
                          <div
                            onClick={() => whiteMove && navigateToMove(i * 2)}
                            className={cn(
                              "text-center py-1 px-2 rounded cursor-pointer hover:bg-gray-600 transition-colors",
                              viewingHistoryIndex === i * 2 && "bg-purple-700",
                              i * 2 === gameHistory.length - 1 && viewingHistoryIndex === null && "bg-gray-700",
                            )}
                          >
                            {whiteMove ? (
                              <span className="font-mono">
                                {whiteMove.san}
                                {whiteMove.flags.includes("c") && <span className="text-red-400 ml-1">×</span>}
                                {whiteMove.flags.includes("+") && <span className="text-yellow-400 ml-1">+</span>}
                                {whiteMove.flags.includes("#") && <span className="text-red-500 ml-1">#</span>}
                              </span>
                            ) : (
                              ""
                            )}
                          </div>
                          <div
                            onClick={() => blackMove && navigateToMove(i * 2 + 1)}
                            className={cn(
                              "text-center py-1 px-2 rounded cursor-pointer hover:bg-gray-600 transition-colors",
                              viewingHistoryIndex === i * 2 + 1 && "bg-purple-700",
                              i * 2 + 1 === gameHistory.length - 1 && viewingHistoryIndex === null && "bg-gray-700",
                            )}
                          >
                            {blackMove ? (
                              <span className="font-mono">
                                {blackMove.san}
                                {blackMove.flags.includes("c") && <span className="text-red-400 ml-1">×</span>}
                                {blackMove.flags.includes("+") && <span className="text-yellow-400 ml-1">+</span>}
                                {blackMove.flags.includes("#") && <span className="text-red-500 ml-1">#</span>}
                              </span>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}
