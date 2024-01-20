# rescript-bedrock

一个 Minecraft bedrock Script API ReScript 绑定（生成器）。

## 为什么选择ReScript？
**ReScript** 是一种静态类型语言，可以编译为高效且易读的JavaScript。
- 在不担心`any`类型（在typescript中）的情况下，利用JavaScript的（几乎）全部功能。
- ReScript具有比TypeScript更快的构建系统。
- ReScript具有像**ML**和**Haskell**一样强大的类型系统 (HM Type System)。

## 用法
此存储库提供CLI工具，用于创建ScriptAPI的绑定。

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

- 选项
  + -V，--version                      输出版本号
  + -h，--help                         显示命令的帮助
- 命令
  + list <branch>                      列出指定分支中脚本模块中的所有文件
  + fetch [选项] <branch> <index>       在指定分支中获取脚本模块中的单个文件
  + generate <path> <output>           从元数据生成rescript绑定
  + process <branch> <index> <output>  获取元数据并生成rescript绑定
  + help [command]                     显示命令的帮助

一个简单的命令示例：

```sh
bun run main.ts process preview 17 src/Server.res
```

## 示例
- 杀死名字不是**Lampese**的聊天发送者
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

- 执行命令
```rescript
let over_world = world->World.getDimension("overworld")
over_world->Dimension.runCommand("say 你好，世界！")->ignore
```

- 杀死所有玩家
```rescript
world->World.getAllPlayers->map((e: Player.t) => {
  e->Player.kill
})->ignore
```

更多示例，请查看目录`demo`。

## 设计
### 类型映射
元数据中的类型定义（类似于TypeScript）将被映射到ReScript类型：
- 数组类型：`T[] -> array<Tt>`
- 选项类型：`T | undefined -> option<t>`
- 布尔类型：`boolean -> bool`
- 数字类型：
  - `int64 -> int`
  - `int32 -> int`
  - `uint32 -> int`
  - `uint64 -> int`
  - `float -> float`
  - `double -> float`
- Promise类型：`Promise<T> -> promise<t>`
- 联合类型：`A | B | C -> @unwrap [ | #A(a) | #B(a) | #C(c) ]`
- 枚举类型：`enum T { A1 = V1, A2 = V2, ... } -> type t = | @as(V1) A1 | @as(V2) A2 | ...`
- 接口类型：
  - `interface T {...} -> type t = {...}`
  - `interface T extends E {...} -> type t = { ...e, ... }` 
- Map类型：
  - `Map<string, T> -> Belt.Map.String.t<t>`
  - `Map<int, T> -> Belt.Map.Int.t<t>`
- 类型：
  - 引入：`class T -> type _T`
  - 继承：
    - 基本类型：`module Impl = ( T: { type t } ) => {}`
    - 子类型：`include Impl({ type t = t })`
  - 形成：`class T -> Module T = { type t = _T }`
- 函数类型：`(a: A, b: B): c: C -> (A, B) => C`
- 空类型：`void -> unit`
- 生成器：**未实现**

### 类处理
- 对于可能返回`null`或`undefined`的任何函数，请使用`@return(nullable)`标签。
  - 可选函数参数可以用`option<T>`编码
- 附加到JS对象（而不是JS模块）的函数需要一种特殊的绑定方式，使用`@send`
- 获取类的静态字段
  - `@scope("ClassName") @val external field: string = "field"`
- 变长函数参数（使用标签`@variadic`）
  - （注意：**目前未使用**）
- 多态参数：对于具有变体类型的参数：
  - `@unwrap[ |#A(t1) |#B(t2) ]`
  - 有限字符串或整数参数：
    - `@string[#str1|#str2|@as("str3") #Str3]`
    - `@int[#int1|#int2|#int3]`
- 脚本API中唯一的依赖类型是`Component[T]`，其中类型函数由`string`类型索引
  - 返回类型设置为`Component`
  - 添加一个模块`Component`用于不安全的转换

## 待办事项
- [ ] 支持`Generator`类型
- [ ] 自动生成和发布
- [ ] 带有`@ocaml.doc`的文档

## 贡献者
- CAIMEO
- Lampese