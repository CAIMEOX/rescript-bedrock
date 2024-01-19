# rescript-bedrock

Minecraft bedrock Script API ReScript wrapper.

## Why ReScript?
**ReScript** is a statically typed language that compiles to efficient and human-readable JavaScript.
- Leverage the full power of JavaScript in a typed language without the fear of `any` types (in typescript).
- ReScript has a faster build system than TypeScript.
- ReScript has a very powerful type system like **ML** and **Haskell**

## Usage
This repo provides CLI tools to create wrapper of ScriptAPI.

```sh
Usage: rescript-bedrock [options] [command]

CLI to fetch and process Minecraft metadata

Options:
  -V, --version                      output the version number
  -h, --help                         display help for command

Commands:
  list <branch>                      List all files in script module in a specify branch
  fetch [options] <branch> <index>   Fetch a single file in script module in a specify branch
  generate <path> <output>           Generate rescript binding from metadata
  process <branch> <index> <output>  Fetch metadata and generate rescript binding
  help [command]                     display help for command
```

A simple command example can be:

```sh
bun run main.ts process preview 17 src/Server.res
```

## Examples
- Kill chat sender whose name is not **Lampese** 
```rescript
open Server
open WorldAfterEvents
open ChatSendAfterEventSignal

let on_chat = (e: ChatSendAfterEvent.t) => {
  open ChatSendAfterEvent
  open Player
  if e->sender->name !== "Lampese" {
    e->sender->kill->ignore
  }
}

world->World.afterEvents->chatSend->subscribe(on_chat)->ignore
```

- Execute a command
```rescript
let over_world = world->World.getDimension("overworld")
over_world->Dimension.runCommand("say Hello World!")->ignore
```

- Kill all players
```rescript
world->World.getAllPlayers->map((e: Player.t) => {
  e->Player.kill
})->ignore
```

For more examples, go to directory `demo`.

## Design
### Type Mapping
The type definitions in metadata (TypeScript-like) will be mapped into ReScript types:
- Array Type: `T[] -> array<Tt>`
- Option Type: `T | undefined -> option<t>`
- Boolean Type: `boolean -> bool`
- Number Type: 
  - `int64 -> int`
  - `int32 -> int`
  - `uint32 -> int`
  - `uint64 -> int`
  - `float -> float`
  - `double -> float`
- Promise Type: `Promise<T> -> promise<t>`
- Union Type: `A | B | C -> @unwrap [ | #A(a) | #B(a) | #C(c) ]`
- Enum Type: `enum T { A1 = V1, A2 = V2, ... } -> type t = | @as(V1) A1 | @as(V2) A2 | ...`
- Interface Type:
  - `interface T {...} -> type t = {...}`
  - `interface T extends E {...} -> type t = { ...e, ... }` 
- Map Type:
  - `Map<string, T> -> Belt.Map.String.t<t>`
  - `Map<int, T> -> Belt.Map.Int.t<t>`
- Class Type:
  - Introduction: `class T -> type _T`
  - Inheritance:
    - Base type: `module Impl = ( T: { type t } ) => {}`
    - Sub type: `include Impl({ type t = t })`
  - Formation: `class T -> Module T = { type t = _T }`
- Function Type: `(a: A, b: B): c: C -> (A, B) => C`
- Void Type: `void -> unit`
- Generator: **unimplemented**

### Class handling
- For any function that might return `null` or `undefined`, use `@return(nullable)` tag.
  - Optional function argument can be encoded with `option<T>`
- Functions attached to a JS objects (other than JS modules) require a special way of binding to them, using `@send`
- Get static field of class
  - `@scope("ClassName") @val external field: string = "field"`
- Variadic Function Arguments (Use tag `@variadic`) 
  - (note: **unused** currently)
- Polymorphic Arguments: for arguments with variant type:
  - `@unwrap[ |#A(t1) |#B(t2) ]`
  - for finite string or int arguments: 
    - `@string[#str1|#str2|@as("str3") #Str3]`
    - `@int[#int1|#int2|#int3]`
- The only Dependent Types in Script API is `Component[T]` where the type function is indexed by `string` type
  - Return type is set to `Component`
  - Add a module `Component` for unsafe casts

## To Do
- [ ] Support generator type
- [ ] Auto generate and publish
- [ ] Documentation with `@ocaml.doc`

## Contributors
- CAIMEO
- Lampese