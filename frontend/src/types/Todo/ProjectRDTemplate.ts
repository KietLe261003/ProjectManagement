import type { ProjectRDTemplatePhase } from './ProjectRDTemplatePhase'

export interface ProjectRDTemplate{
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
	/**	template_name : Data	*/
	template_name: string
	/**	description : Small Text	*/
	description?: string
	/**	default_buffer_days : Int	*/
	default_buffer_days?: number
	/**	Phase : Table - ProjectRDTemplatePhase	*/
	phase?: ProjectRDTemplatePhase[]
}