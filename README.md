# rescript-bedrock

Minecraft bedrock script API rescript binding.

## Run
Before running the generator you should fetch the metadata.
```sh
bun run fetch.ts
```

Then generates a library file in `lib`
```sh
bun run main.ts
```

## Type Mapping
- Array Type: `T[] -> array<T>`
- Option Type: `T | undefined -> option<T>`
- Boolean Type: `boolean -> bool`
- Number Type: `number -> int` or `number -> float`
- Promise Type: `Promise<T> -> promise<T>`
- Union Type: `A | B | C -> Any('a): t`
- Class Type: `class T -> module T`
- Void Type: `void -> ()`

## Function handling
- For any function that might return `null` or `undefined`, use `@return(nullable)` tag
- Optional function argument can be encoded with `option<T>`
- Functions attached to a JS objects (other than JS modules) require a special way of binding to them, using `send`
- Variadic Function Arguments (Use tag `@variadic`) (note: not found such type of API)
- Polymorphic Arguments: for arguments with variant type:
  - `@unwrap[|#A(t1)|#B(t2)]`
  - Type can be callback function
  - for finite string or int arguments: 
    - `@string[#str1|#str2|@as("str3") #Str3]`
    - `@int[#int1|#int2|#int3]`
- Some wired types
  - The `getDynamicProperty` function returns union types
    - `getDynamicProperty(identifier: string): boolean | number | string | Vector3 | undefined`

## Some Ideas
- Using `include` in a module statically "spreads" a module's content into a new one, thus often fulfill the role of "**inheritance**" or "**mixin**". (This is equivalent to a compiler-level copy paste.)
- Use **Implementation inheritance** for inheritance class
- For documentation, use attribute `@ocaml.doc` before the object

## RoadMap
- [x] create name mapping
- [x] handle all enum types
- [x] handle all constants types
- [x] handle all error types
- [x] handle all interfaces
- [x] handle all classes
- [x] handle all interfaces
  - Collect all inheritance Classes
  - Build inheritance graph
- [x] fix dependent types
- [x] interface inheritance
- [ ] support generator type
- [ ] better cli of fetch support
- [ ] auto generate and publish

## Contributors
- CAIMEO
- Lampese