import {
	Types,
	VariantType,
	ConstantsType,
	FunctionType,
    Module,
	InterfaceType,
    LayerString,
	ErrorType,
    TypeFamily,
	EnumType,
	ClassType
} from './meta';
import { readFileSync, writeFileSync } from 'fs';
import Graph from 'graph-data-structure';
const types: Types = JSON.parse(readFileSync('./meta/server.json', 'utf-8'));
const module_meta = {
	name: types.name,
	version: types.version,
	minecraft_version: types.minecraft_version
};
const rescript_keywords = ['with', 'type', 'private'];
const primitive_types = [
	'int32',
	'int64',
	'float',
	'boolean',
	'string',
	'undefined',
	'null',
	'closure',
	'void',
	'uint32',
	'variant'
];
const name_mapping: Map<string, string> = new Map();
name_mapping.set('boolean', 'bool');
name_mapping.set('double', 'float');
name_mapping.set('undefined', 'unit');
name_mapping.set('uint32', 'int32');
name_mapping.set('uint64', 'int32');
name_mapping.set('int16', 'int32');
name_mapping.set('int64', 'int32');
name_mapping.set('T', 'string'); // unsafe (for dependent types)
const cc2sc = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const format_value = (value: number | string) => (typeof value === 'string' ? `"${value}"` : value);
const tag = (s: string) => `/* ${s} */`
const extract_type = (typ: VariantType): string => {
	if (typ.optional_type) {
		return extract_type(typ.optional_type);
	} else if (typ.element_type) {
		return extract_type(typ.element_type);
	} else {
		return typ.name;
	}
};
const format_type = (typ: VariantType, origin: string[] | undefined = undefined): string => {
	if (typ.optional_type) {
		return `option<${format_type(typ.optional_type, origin)}>`;
	} else if (typ.name === 'array') {
		return `array<${format_type(typ.element_type!, origin)}>`;
	} else if (typ.name === 'variant') {
		return `@unwrap[${typ.variant_types
			?.map((v) => ` | #${capitalize(v.name)}(${format_type(v, origin)})`)
			.join('')} ]`;
	} else if (typ.name === 'map') {
        const keyType = format_type(typ.key_type!, origin);
		return `Belt.Map.${keyType === 'string' ? 'String' : 'Int'}.t<${format_type(
			typ.value_type!,
			origin
		)}>`;
	} else if (typ.name === 'closure') {
		return `(${typ.closure_type?.argument_types
			.map((x) => format_type(x, origin))
			.join(',')}) => ${format_type(typ.closure_type!.return_type, origin)}`;
	} else if (typ.name === 'promise') {
		return `promise<${format_type(typ.promise_type!, origin)}>`;
	} else if (typ.name.includes('[T]')) {
        // Patch for dependent types
        // split by TypeMap[T]
        const [name, _] = typ.name.split('TypeMap[T]');
        return `option<_${name}>`
    } else {
		if (origin && typ.name == origin[0]) return origin[1];
		return name_mapping.has(typ.name) ? name_mapping.get(typ.name)! : cc2sc(typ.name);
	}
};
const transform = {
	enum: (e: EnumType) => {
		name_mapping.set(e.name, cc2sc(e.name));
		return `type ${cc2sc(e.name)} = ${e.constants
			.map((c) => `| @as(${format_value(c.value)}) ${capitalize(c.name)}`)
			.join(' ')}`;
	},
	constant: (c: ConstantsType) => `@val @module("${module_meta.name}") external ${cc2sc(c.name)}: ${format_type(c.type)} = "${c.name}"`,
	error: (e: ErrorType) => `exception ${e.name}`,
	interface: (i: InterfaceType) => {
		name_mapping.set(i.name, cc2sc(i.name));
	},
	class: (c: ClassType) => {}
};

const generate_header = () => [
	`/* This file is generated by rescript-bedrock */`,
	`/* Module ${module_meta.name} v${module_meta.version} for Minecraft ${module_meta.minecraft_version} */`
];

const generate_enum = () => types.enums.map(transform.enum);

const generate_class_introduction = () =>
	types.classes.map((c: ClassType) => {
		name_mapping.set(c.name, '_' + c.name);
		return `type _${c.name} `;
	});

const generate_interface = () => {
	let interfaceMap: Map<string, InterfaceType> = new Map();
	let flow_chart = Graph();
	let result: string[] = [];
	types.interfaces.map((i: InterfaceType) => {
		interfaceMap.set(i.name, i);
		i.properties.map((p) => {
			if (primitive_types.includes(extract_type(p.type))) return;
			if (i.name == extract_type(p.type)) return;
			flow_chart.addEdge(extract_type(p.type), i.name);
		});
	});
	const interface_transform = (i: InterfaceType) => {
        const props = (i.base_types && i.base_types.length > 0) ? 
            interfaceMap.get(i.base_types[0].name)!.properties.concat(i.properties) : i.properties;
		const fields = props
			.map((v: ConstantsType) => {
				const obj_name = rescript_keywords.includes(cc2sc(v.name))
					? `@as("${cc2sc(v.name)}") ${cc2sc(v.name)}_`
					: cc2sc(v.name);
				return `${obj_name}: ${format_type(v.type)}`;
			})
			.join(', ');
		const prefix = fields.includes(cc2sc(i.name)) ? 'type rec' : 'type';
		result.push(`${prefix} ${cc2sc(i.name)} = {${fields}}`);
	};
	const sorted = flow_chart.topologicalSort()
	sorted.map((name) => {
		if (name_mapping.has(name)) return;
		const i = interfaceMap.get(name)!;
		interface_transform(i);
	});
	interfaceMap.forEach((v, k) => {
		if (sorted.includes(k)) return;
		interface_transform(v)
	})
	return result;
};

const make_module = (m: Module, writer = new LayerString()): string => {
	writer.write(`module ${m.name} = `).left_brace().writeln(`type t = _${m.name}`);

	if (m.inheritance) writer.writeln(`include ${m.inheritance}.Impl({ type t = t })`);
	if (m.base_class) writer.write(`module Impl = ( T: { type t } ) => `).left_brace();
	m.values.forEach((v, k) => {
		writer.writeln(
			`@module("${module_meta.name}") @scope("${m.name}") @val external ${k}: ${v} = "${k}"`
		);
	});
	m.methods.map((f) => {
		const prefix = f.return_type.startsWith('option') ? '@send @return(nullable)' : '@send';
		writer.writeln(
			`${prefix} external ${f.name}: (${f.arguments.join(', ')}) => ${f.return_type} = "${
				f.name
			}"`
		);
	});
	m.getter.map((g) => {
		const n = rescript_keywords.includes(g.name) ? `get${capitalize(g.name)}` : g.name;
		writer.writeln(`@get external ${n}: ${g.arguments[0]} => ${g.return_type} = "${g.name}"`);
	});
	m.setter.map((s) => {
		writer.writeln(
			`@set external set${capitalize(s.name)}: (${s.arguments.join(', ')}) => ${
				s.return_type
			} = "${s.name}"`
		);
	});
	if (m.base_class) writer.right_brace();
	if (m.base_class) writer.writeln(`include Impl({ type t = t })`);
	if (m.constructor_) {
		writer.writeln(
			`@new external make: (${m.constructor_.arguments.join(', ')}) => ${
				m.constructor_.return_type
			} = "${m.name}"`
		);
	}
	writer.right_brace();
	return writer.content;
};

const generate_class = () => {
	const base_class: Set<string> = new Set();
    const flow_chart = Graph();
	types.classes.map((c) => {
		c.base_types.map((base) => {
            if (base.name === c.name) return;
			base_class.add(base.name);
            flow_chart.addEdge(base.name, c.name);
		});
	});
   
	const res: string[] = [];
	const class_transform = (c: ClassType) => {
		const cons = c.functions.filter((f) => f.is_constructor);
		const type_name = [c.name, base_class.has(c.name) ? 'T.t' : 't'];
		const module: Module = {
			name: c.name,
			base_class: base_class.has(c.name),
			inheritance: c.base_types.length > 0 ? c.base_types[0].name : undefined,
			values: new Map(),
			constructor_:
				cons.length === 1
					? {
							name: 'make',
							return_type: type_name[1],
							arguments: cons[0].arguments.map((a) => format_type(a.type, type_name))
					  }
					: undefined,
			setter: [],
			getter: [],
			methods: []
		};
		c.functions
			.filter((f) => !f.is_constructor)
			.map((f: FunctionType) => {
				if (f.arguments.find((x) => x.type.name === 'generator')) return; // unsupported type generator
				module.methods.push({
					name: f.name,
					return_type: format_type(f.return_type, type_name),
					arguments: [
						type_name[1],
						...f.arguments.map((a) => format_type(a.type, type_name))
					]
				});
			});
		c.constants.map((c: ConstantsType) => {
			module.values.set(c.name, format_type(c.type));
		});
		c.properties.map((p: ConstantsType) => {
			module.getter.push({
				name: p.name,
				return_type: format_type(p.type, type_name),
				arguments: [type_name[1]]
			});
			if (!p.is_read_only) {
				module.setter.push({
					name: p.name,
					return_type: 'unit',
					arguments: [type_name[1], format_type(p.type, type_name)]
				});
			}
		});
		res.push(make_module(module));
	};
    flow_chart.topologicalSort().map((name) => {
        if (!base_class.has(name)) return;
        class_transform(types.classes.find((c: ClassType) => c.name == name)!)
    })
	// types.classes.filter((c: ClassType) => base_class.has(c.name)).map(class_transform);
	types.classes.filter((c: ClassType) => !base_class.has(c.name)).map(class_transform);
	return res;
};
const generate_type_map = () => 
    types.type_aliases.map((t: TypeFamily) => {
        const writer = new LayerString();
        writer.write(`module ${t.name} = `).left_brace();
        writer.writeln(`/* unsafe cast */`)
        t.mappings.map((x) => {
            writer.writeln(`external to${x.value}: _${t.type.name} => _${x.value} = "%identity"`)
        } )
        writer.right_brace();
        return writer.content;
    })


const generate_errors = () => types.errors.map(transform.error);
const generate_constants = () => types.constants.map(transform.constant).concat(types.objects.map(transform.constant));
const main = (path: string) => {
	const code = [
		generate_header(),
		tag('Enum definition'),
		generate_enum(),
		tag('Error definition'),
		generate_errors(),
		tag('Class introduction'),
		generate_class_introduction(),
		tag('Interface definition'),
		generate_interface(),
		tag('Class definition'),
        generate_class(),
		tag('Type conversion'),
        generate_type_map(),
		tag('Constants'),
        generate_constants()
	]
		.flat()
		.join('\n');
	writeFileSync(path, code)
};

main('./lib/Server.res');
