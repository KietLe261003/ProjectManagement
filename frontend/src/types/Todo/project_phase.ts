import type { ProjectPhaseTask } from './ProjectPhaseTask'

export interface project_phase{
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
	/**	Subject : Data	*/
	subject?: string
	/**	Status : Select	*/
	status?: "Open" | "Working" | "Completed"
	/**	Priority : Select	*/
	priority?: "Low" | "Medium" | "High" | "Urgent"
	/**	Department : Link - Department	*/
	department?: string
	/**	Start Date : Date	*/
	start_date?: string
	/**	End Date : Date	*/
	end_date?: string
	/**	Progress : Percent	*/
	progress?: number
	/**	Details : Data	*/
	details?: string
	/**	Costing : Currency	*/
	costing?: number
	/**	Project : Link - Project	*/
	project?: string
	/**	Tasks : Table - Project Phase Task	*/
	tasks?: ProjectPhaseTask[]
}