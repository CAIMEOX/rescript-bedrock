/**
 * @coauthor: Lampese
 */

interface VariantType {
	is_bind_type: boolean;
	is_errorable: boolean;
	name: string;
	valid_range?: {
		max?: number;
		min?: number;
	};
	closure_type?: ClosureType;
	key_type?: VariantType;
	value_type?: VariantType;
	promise_type?: VariantType;
	element_type?: VariantType;
	optional_type?: VariantType;
	variant_types?: VariantType[];
}

interface TypeFamily {
	alias_type: string;
	mappings: {
		name: string;
		value: string
	}[];
	name: string;
	type: VariantType;
}

interface ClosureType {
	argument_types: VariantType[];
	return_type: VariantType;
}

interface ArgumentsType {
	details: null | {
		default_value?: boolean;
		max_value?: boolean;
		min_value?: boolean;
	};
	name: string;
	type: VariantType;
}

interface FunctionType {
	arguments: ArgumentsType[];
	is_constructor: boolean;
	is_static: boolean;
	name: string;
	privilege: 'read_only' | 'none';
	return_type: VariantType;
}

interface ConstantsType {
	is_read_only: boolean;
	is_static?: boolean;
	name: string;
	type: VariantType;
	value: number | string;
}

interface ClassType {
	name: string;
	constants: ConstantsType[];
	base_types: VariantType[];
	functions: FunctionType[];
	properties: ConstantsType[];
	type: VariantType;
}

interface EnumType {
	name: string;
	constants: ConstantsType[];
}

interface InterfaceType {
	name: string;
	base_types: VariantType[];
	properties: ConstantsType[];
	type: VariantType;
}

interface ErrorType extends InterfaceType {}

// All types in metadata
interface Types {
	name: string;
	uuid: string;
	version: string;
	module_type: string;
	minecraft_version: string;
	classes: ClassType[];
	constants: ConstantsType[];
	enums: EnumType[];
	errors: ErrorType[];
	functions: FunctionType[];
	interfaces: InterfaceType[];
	type_aliases: TypeFamily[];
	objects: ConstantsType[];
}

type ExternalFn = {
	name: string;
	return_type: string;
	arguments: string[];
};

type Module = {
	name: string;
	base_class: boolean;
	inheritance: string | undefined;
	values: Map<string, string>; // name -> type
	setter: ExternalFn[];
	constructor_: ExternalFn | undefined;
	getter: ExternalFn[];
	methods: ExternalFn[];
};

class LayerString {
	ident: number = 0;
	ident_stack: number[] = [];
	content: string = '';
	constructor() {}
	get inner() {
		return this.content;
	}

	tab() {
		this.ident += 1;
		return this;
	}

	back() {
		this.ident -= 1;
		return this;
	}

	newline() {
		this.content += '\n';
		return this;
	}

	write(s: string) {
		this.content += '  '.repeat(this.ident) + s;
		return this;
	}

	writeln(s: string) {
		this.write(s + '\n');
		return this;
	}

	left_brace() {
		this.ident_stack.push(this.ident);
		this.tab();
		this.content += '{\n';
		return this;
	}

	right_brace() {
		this.ident = this.ident_stack.pop()!;
		this.writeln('}');
		return this;
	}
}

export {
	ExternalFn,
	LayerString,
	Module,
	Types,
	ErrorType,
	VariantType,
	ConstantsType,
	FunctionType,
	InterfaceType,
	TypeFamily,
	EnumType,
	ClassType
};
