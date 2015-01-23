module Intent where

import Model
import View
import Signal


intent :: ViewEvent -> [GameAction]
intent Init = []
intent (PieceClicked p) = [TogglePiece p]
intent (SquareEntered r c) = [TargetDrop r c]
intent (SquareExited r c) = [DiscardDrop r c]
intent (SquareClicked r c) = [Drop r c]
intent (SquareDblClicked r c id) = [Remove r c id]
intent HintClicked = [Hint]
intent GiveUpClicked = [GiveUp]
