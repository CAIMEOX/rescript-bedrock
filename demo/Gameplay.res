open Server
open Js.Array2

let start_tick = 100
let y_offset = -60.

let init_break_the_terracotta = () => {
  open World
  open Scoreboard
  let exn = Belt.Option.getExn
  let overworld = world->getDimension("overworld")
  let score_obj = ref(world->scoreboard->getObjective("score"))

  switch score_obj.contents {
  | None =>
    score_obj.contents = Some(world->scoreboard->addObjective("score", ~displayName="level"))
  | Some(_) => ()
  }

  overworld->Dimension.getEntities(~options={exclude_types: ["player"]})->map(Entity.kill)->ignore

  world
  ->scoreboard
  ->setObjectiveAtDisplaySlot(Sidebar, {objective: exn(score_obj.contents)})
  ->ignore

  world
  ->getAllPlayers
  ->forEach((player: Player.t) => {
    open Player
    player->runCommand("scoreboard players set @s score 0")->ignore
    let inv = player->getComponent("inventory")

    switch inv {
    | None => ()
    | Some(inv) => {
        open EntityInventoryComponent
        let invComp = EntityComponentTypeMap.toEntityInventoryComponent(inv)
        invComp
        ->container
        ->exn
        ->Container.addItem(ItemStack.make(#String("diamond_sword"), 1))
        ->ignore
        invComp->container->exn->Container.addItem(ItemStack.make(#String("dirt"), 64))->ignore

        player->teleport(
          {
            x: 3.,
            y: y_offset,
            z: 3.,
          },
          ~teleportOptions={
            rotation: {
              x: 0.,
              y: 0.,
            },
          },
        )
      }
    }
  })

  world->sendMessage(#String("BREAK THE TERRACOTTA!"))
}

let curTic = ref(0)
let rec game_tick = () => {
  curTic := curTic.contents + 1
  if curTic.contents === start_tick {
    init_break_the_terracotta()
  }

  system->System.run(game_tick)->ignore
}

system->System.run(game_tick)->ignore
