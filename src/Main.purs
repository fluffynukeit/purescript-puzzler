module Main where

import Model
import View
import Intent

import Control.Monad.Eff
import Signal.Channel
import Signal
import VirtualDOM.VTree
import Signal.Time

main = do
  b <- mkBoard 10 10 4
  c <- channel Init
  let actions = intent <~ subscribe c
  let states = foldp processUpdates (gameInit b) actions
  let views = puzzlerView c <~ distinct' states
  windowOnLoad $ viewRender puzzlerInit views
