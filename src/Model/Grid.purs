module Model.Grid 
  ( Grid()
  , initWith
  , init
  , null
  , singleton
  , map
  , rows, row, mrow
  , cols, col, mcol
  , fud, flr, rcw, rccw
  , drop
  , take
  , extract
  , lkup
  , updateAt
  , toArray
  , filter
  , zipWith
  , findIndex
  )
where

import Data.Maybe
import Data.Maybe.Unsafe
import qualified Data.Array as A
import Data.Function
import Data.Foldable

-- Grid Operations

type Grid a = [[a]]


foreach = flip A.map
(..) = A.(..)

initWith :: forall a. (Number -> Number -> a) -> Number -> Number -> Grid a
initWith fn nr nc = foreach (0..(nr-1)) $ \r -> foreach (0..(nc-1)) $ \c -> fn r c

init val = initWith (\_ _ -> val)

null = A.length >>> ((==) 0)

singleton :: forall a. a -> Grid a
singleton a = [[a]]

map :: forall a b. (a -> b) -> Grid a -> Grid b
map f = (<$>) ((<$>) f)

rows :: forall a. Grid a -> Number
rows a = A.length a

cols :: forall a. Grid a -> Number
cols [] = 0
cols (a:_) = A.length a

row :: forall a. Number -> Grid a -> [a]
row r g = g A.!! r # fromMaybe []

col :: forall a. Number -> Grid a -> [a]
col c g = A.map (flip A.(!!) c) g # A.catMaybes

-- Maximal row index
mrow g = rows g - 1

-- Maximal col index
mcol g = cols g - 1

-- Flip up/down
fud :: forall a. Grid a -> Grid a
fud = A.reverse

-- Flip left/right
flr :: forall a. Grid a -> Grid a
flr = A.map A.reverse

-- Rotate clockwise
rcw :: forall a. Grid a -> Grid a
rcw g = foreach (0..mcol g) $ \c -> foreach (fud g) (fromJust <<< flip A.(!!) c)

-- Rotate counter clockwise
rccw :: forall a. Grid a -> Grid a
rccw g = foreach (mcol g..0) $ \c -> foreach g (fromJust <<< flip A.(!!) c)

-- Drop leading rows and columns.
drop :: forall a. Number -> Number -> Grid a -> Grid a
drop r c = A.drop r >>> A.map (A.drop c)

-- Take leading rows and columns.
take :: forall a. Number -> Number -> Grid a -> Grid a
take r c = A.take r >>> A.map (A.take c)

-- Take a subsection out of a grid, specifying first and end points to be include
extract :: forall a. Number -> Number -> Number -> Number -> Grid a -> Grid a
extract r1 c1 r2 c2 = drop r1 c1 >>> take (r2-r1+1) (c2-c1+1)

-- Examine the contents of a single Grid cell.
lkup :: forall a. Number -> Number -> Grid a -> Maybe a
lkup r c grid = A.(!!) grid r # maybe Nothing (flip A.(!!) c)

foreign import updateAtImpl """
  function updateAtImpl(r,c,gIn,gBase) {
    var gNew = gBase.slice();
    for (var i = 0; i < gNew.length; i++) {
        gNew[i] = gBase[i].slice();
    }
    for (var i = 0; i < gIn.length; i++) {
      var rowIn = gIn[i];
      for (var j = 0; j < rowIn.length; j++) {
        var tR = r + i; var tC = j + c;
        if (tR >= 0 && tR < gBase.length && tC >= 0 && tC < gBase[tR].length)
           gNew[tR][tC] = gIn[i][j];
      }
    }
    return gNew;
  };""" :: forall a. Fn4 Number Number (Grid a) (Grid a) (Grid a)

-- Insert the contents of a Grid A into another Grid B.  Parts of Grid A will
-- be cut off if they don't fit in B.
updateAt = runFn4 updateAtImpl

-- Operate element by element across two grids.
zipWith :: forall a b c. (a -> b -> c) -> Grid a -> Grid b -> Grid c
zipWith f = A.zipWith (A.zipWith f)

-- Return all Grid elements in groups of rows.
toArray :: forall a. Grid a -> [a]
toArray = A.concat

-- Return the smallest Grid containing all elements satisfying a predicate.
filter :: forall a. (a -> Boolean) -> Grid a -> Grid a
filter f g = foldl collect acc g # \s -> extract s.r1 s.c1 s.r2 s.c2 g
  where
    acc = { curRow:0, r1:mrow g, r2:0, c1:mcol g, c2:0 }
    collect acc row = 
      let p = { c1':A.findIndex f row, c2':A.findLastIndex f row }
          found = p.c1' >= 0
      in  { curRow: acc.curRow + 1 
          , r1: if found && acc.curRow < acc.r1 then acc.curRow else acc.r1
          , r2: if found && acc.curRow > acc.r2 then acc.curRow else acc.r2
          , c1: if found && p.c1' < acc.c1 then p.c1' else acc.c1
          , c2: if found && p.c2' > acc.c2 then p.c2' else acc.c2
          }

-- Look for the top left r/c position in grid matching input Grid
foreign import findIndex' """
  function findIndex$prime(just, nothing, eq, needle, haystack) {
    for (var r = 0; r < haystack.length; r++) {
      colsearch:
      for (var c = 0; c < haystack[r].length; c++) {
        for (var rn = 0; rn < needle.length; rn++) {
          for (var cn = 0; cn < needle[rn].length; cn++) {
            if (! eq(needle[rn][cn])(haystack[r+rn][c+cn])) {
               continue colsearch;
            }
          }
        }
        return just({r:r, c:c});
      }
    }
    return nothing;
  }""" :: forall a. Fn5 ({r::Number,c::Number} -> Maybe {r::Number,c::Number})
                        (Maybe {r::Number,c::Number})
                        (a -> a -> Boolean)
                        (Grid a)
                        (Grid a)
                        (Maybe {r::Number,c::Number})


findIndex :: forall a. (Eq a) => Grid a -> Grid a -> Maybe {r::Number, c::Number}
findIndex [[]] _ = Nothing
findIndex n h = runFn5 findIndex' (Just) (Nothing) (==) n h

