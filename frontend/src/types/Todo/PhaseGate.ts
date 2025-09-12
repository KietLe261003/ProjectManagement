
export interface PhaseGate{
	name: string
	creation: string
	modified: string
	owner: string
	modified_by: string
	docstatus: 0 | 1 | 2
	parent?: string
	parentfield?: string
	parenttype?: string
	idx?: number
	/**	Target : Data	*/
	target: string
	/**	EvaluationContent : Small Text	*/
	evaluationcontent: string
	/**	Result : Small Text	*/
	result: string
	/**	Report : Attach	*/
	report?: string
}