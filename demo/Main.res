open! Server
open WorldAfterEvents
open ChatSendAfterEventSignal
open Js.Array2

let add = (a: vector3, b: vector3) => {
  {
    x: a.x +. b.x,
    y: a.y +. b.y,
    z: a.z +. b.z,
  }
}

type space = array<vector3>
let overworld = world->World.getDimension("overworld")

let projection = (space: space, origin: vector3) => {
  space->map((v: vector3) => {
    let pos = add(v, origin)
    let block = overworld->Dimension.getBlock(pos)
    switch block {
    | Some(b) => b->Block.setType(#String("minecraft:iron_block"))
    | None => ()
    }
  })
}

let matrix_origin = (vec: vector3) => {
  let {x, y, z} = vec
  Js.Math.sqrt(x *. x +. y *. y +. z *. z)
}

external id: int => float = "%identity"
let sphere = (r: int32) => {
  let result = []
  for x in -r to r {
    for y in -r to r {
      for z in -r to r {
        let {x, y, z} = {x: id(x), y: id(y), z: id(z)}
        if matrix_origin({x, y, z}) <= id(r * r) {
          result->push({x, y, z})->ignore
        }
      }
    }
  }
  result
}

let pos: ref<vector3> = ref({x: 0.0, y: 0.0, z: 0.0})

let on_chat = (e: ChatSendAfterEvent.t) => {
  open ChatSendAfterEvent
  open Player
  if e->sender->name !== "Lampese" {
    e->sender->kill->ignore
  }
  switch e->message {
  | "position" => pos.contents = e->sender->location
  | "sphere" => projection(sphere(5), pos.contents)->ignore
  | _ => ()
  }
}

world->World.afterEvents->chatSend->subscribe(on_chat)->ignore
world->World.getAllPlayers->map(Player.kill)->ignore
overworld->Dimension.runCommand("say Hello World!")->ignore
