export interface FieldControl {
	readonly id: string;
	readonly describedby: string | undefined;
	readonly invalid: boolean;
	readonly required: boolean;
}
export function fieldControl(): FieldControl | undefined;
export function setFieldControl(
	context: FieldControl | undefined,
): FieldControl | undefined;
