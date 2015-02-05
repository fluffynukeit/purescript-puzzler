module Model where


import Model.Grid
import Control.Monad.Eff
import Control.Monad.Eff.Random
import Control.Monad
import Data.Maybe
import Data.Maybe.Unsafe
import qualified Data.Array as A
import Data.Foldable


gameInit :: Board -> GameState
gameInit b = 
  { board:clear b
  , solution:b
  , piecesLeft:pieces b
  , selectedPiece: Nothing
  , dropTarget: DropCandidate [] true
  , victory : Nothing
  }

processUpdates :: [GameAction] -> GameState -> GameState
processUpdates =  flip (foldl (flip updateGame))

updateGame :: GameAction -> GameState -> GameState
updateGame _ s | isJust s.victory = s -- if game is over, never update state

updateGame (TogglePiece p) s =
  case s.selectedPiece of
    Nothing -> s { selectedPiece = Just p }
    -- For some reason, using the below 2 lines cause a rapid cycle in piece selection
    Just p' | p == p' -> s { selectedPiece = Nothing } 
            | otherwise -> s { selectedPiece = Just p}

updateGame (TargetDrop r c) s = 
  case s.selectedPiece of
    Nothing -> s
    Just p -> s { dropTarget = DropCandidate (targetArea r c p) (isJust $ place r c p s.board) }
updateGame (DiscardDrop r c) s = 
  case s.dropTarget of
    DropCandidate [] _ -> s
    _ -> s { dropTarget = DropCandidate [] true }

updateGame (Drop r c) s = 
  case s.selectedPiece >>= flip (place r c) s.board of
    Nothing -> s
    Just b -> 
      let piecesLeft = A.delete (fromJust s.selectedPiece) s.piecesLeft
      in s { board = b
           , selectedPiece = Nothing
           , piecesLeft = piecesLeft
           , dropTarget = DropCandidate [] true
           , victory = if A.length piecesLeft == 0 then Just true else Nothing
           }

updateGame (Remove r c id) s = 
  s {board=remove r c s.board, piecesLeft=(findPiece (P id) s.board):s.piecesLeft}

updateGame Hint s | A.length s.piecesLeft == 1 = s -- don't allow final piece to hint
updateGame Hint s =
  case s.selectedPiece of
    Nothing -> s
    Just p -> let sel = find isP (toArray p) # fromJust
                  noObs Obstacle = Empty
                  noObs p' | sel /= p' = Empty
                           | otherwise = p'
                  cleanObs = map noObs s.solution
                  loc = findIndex p cleanObs # fromJust
                  newBoard = place loc.r loc.c p s.board
                  newPieces = A.delete (fromJust s.selectedPiece) s.piecesLeft
              in case newBoard of
                   Nothing -> s -- can't place the piece because it's blocked
                   Just b -> s { board = b
                               , piecesLeft = newPieces
                               , dropTarget = DropCandidate [] true
                               , selectedPiece = Nothing
                               }


updateGame GiveUp s = s { board = s.solution
                        , victory = Just false
                        , selectedPiece = Nothing
                        , piecesLeft = []
                        }

whenJust :: forall a b. Maybe a -> b -> b -> b
whenJust m t f | isJust m = t
               | otherwise = f

data DropCandidate = DropCandidate [{r::Number, c::Number}] Boolean

type GameState = 
  { board :: Board
  , solution :: Board
  , piecesLeft :: [Piece]
  , selectedPiece :: Maybe Piece
  , dropTarget :: DropCandidate
  , victory :: Maybe Boolean
  }

data GameAction
  = TogglePiece Piece
  | TargetDrop Number Number
  | DiscardDrop Number Number
  | Drop Number Number 
  | Remove Number Number Number
  | Hint
  | GiveUp

data Square = P Number
            | Obstacle
            | Empty

type Board = Grid Square
type Piece = Grid Square
type Area = {r1::Number, r2::Number, c1::Number, c2::Number}

instance showSquare :: Show Square where
  show (P n) = "P" ++ show n
  show Obstacle = "O"
  show Empty = "E"

instance eqSquare :: Eq Square where
  (==) (P n)    (P m)    = n == m
  (==) Obstacle Obstacle = true
  (==) Empty    Empty    = true
  (==) _        _        = false
  (/=) a b = not (a == b)

instance ordSquare :: Ord Square where
  compare Empty    Empty = EQ
  compare Empty    _     = LT
  compare (P n)    (P m) = compare n m
  compare (P _)    Empty     = GT
  compare (P _)    Obstacle  = LT
  compare Obstacle Obstacle  = EQ
  compare Obstacle _         = GT


foreign import shuffle """
  var shuffle = function(orig){ 
    return function() {
      var o = orig.slice();
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    };
  }; """ :: forall a e. [a] -> Eff (random :: Random | e) [a]

directions = [{dr:0, dc:1}, {dr:1, dc:0}, {dr:0, dc: -1}, {dr: -1, dc:0}]

isOpen r c grid = 
  case lkup r c grid of
    Nothing -> false -- outside grid bounds
    Just Empty -> true
    Just _ -> false

status = lkup

generateAt :: forall e. Number 
           -> Number 
           -> Number 
           -> Number 
           -> Board 
           -> Eff (random :: Random | e) { g :: Board, sCnt :: Number }
generateAt r c _ _ grid | not (isOpen r c grid) = return {g:grid, sCnt:0}
generateAt r c _ 0 grid = return {g:grid, sCnt:0}
generateAt r c pId count grid = do

  -- try to continue pieces in random directions
  rDirs <- shuffle directions

  -- g is the current grid.  sCnt is the number of squares left to place for the piece
  let go acc d = do
        acc' <- generateAt (r+d.dr) (c+d.dc) pId (count-acc.sCnt) acc.g
        return acc' {sCnt = acc.sCnt + acc'.sCnt}

  foldM (go) {g:updateAt r c (singleton $ P pId) grid, sCnt:1} rDirs

-- Fill a nr x nc grid with connected simple shapes up to maximum length
mkBoard :: forall e. Number 
         -> Number 
         -> Number 
         -> Eff (random :: Random | e) Board
mkBoard nr nc pieceLength = do
  let g = init Empty nr nc
  
      go acc p = do
        {g:g, sCnt:cnt} <- generateAt p.r p.c acc.i pieceLength acc.g
        return { g:g
               , i: if cnt == 0 then acc.i else acc.i+1
               , incompletes: if cnt > 0 && cnt < pieceLength 
                                then acc.i:acc.incompletes 
                                else acc.incompletes
               }

  -- randomly go through the entire grid trying to place pieces
  startPoints <- shuffle $ do
    r <- 0 A... nr-1
    c <- 0 A... nc-1
    return {r:r, c:c}

  result <- foldM go {g:g, i:0, incompletes:[]} startPoints
  
  -- Replace all incomplete pieces with obstacles
  let replacer p@(P sq) = if sq `A.elemIndex` result.incompletes /= -1
        then Obstacle
        else p
      replacer p = p

  let withObstacles = map replacer result.g
  return withObstacles

isP (P _) = true
isP _     = false
  
-- Search through the board to find all pieces, each represented as its own grid.
pieces :: Board -> [Piece]
pieces b = 
  let uniquePs = A.filter isP <<< A.map (fromJust <<< A.head) <<< A.group' $ toArray b
  in  flip A.map uniquePs $ flip findPiece b
        
-- Build a Piece by taking its shape from the board.
findPiece :: Square -> Board -> Piece
findPiece p b = filter ((==) p) b # map (\s -> if s == p then p else Empty)

-- Clear pieces off the board.
clear :: Board -> Board
clear = map (\p -> if isP p then Empty else p)
      
-- Attempt to place a piece on the board, returning updated board if successful.
place :: Number -> Number -> Piece -> Board -> Maybe Board
place r c p b = 
  let rowEdge = r + mrow p
      colEdge = c + mcol p
      loc = extract r c rowEdge colEdge b

      -- Either the piece square or the board square must be empty to be valid
      -- move
      isValid Empty _ = true 
      isValid _ Empty = true
      isValid _ _ = false
      validMove = rowEdge <= mrow b && colEdge <= mcol b &&
                  (zipWith isValid p loc # all id <<< toArray)
      
      insertPiece Empty s = s -- Empty squares in the piece are pass through
      insertPiece s     _ = s -- Otherwise, piece square wins
      loc' = zipWith insertPiece p loc

  in  if not validMove then Nothing else Just $ updateAt r c loc' b
  
-- Replace all connected P cells with the same ID with Empty cells
remove :: Number -> Number -> Board -> Board
remove r c b = go (lkup r c b) r c b
  where 
    go :: Maybe Square -> Number -> Number -> Board -> Board
    go Nothing _ _ b = b
    go mp@(Just p) r c b = 
      case lkup r c b of
        Nothing -> b
        Just Empty -> b
        Just Obstacle -> b
        Just piece -> 
          if piece /= p then b
          else updateAt r c (singleton Empty) b #
                go mp (r+1) c # go mp (r-1) c # go mp r (c+1) # go mp r (c-1)

-- Get the location of a piece on the grid
            
targetArea :: Number -> Number -> Piece -> [{r::Number,c::Number}]
targetArea r c p = 
  let isEmpty {r:r',c:c'} = case lkup (r'-r) (c'-c) p # fromJust of
        Empty -> true
        _ -> false
      coords = do
        r' <- r A... r+mrow p
        c' <- c A... c+mcol p
        return {r:r', c:c'}
  in A.filter (not <<< isEmpty) coords
