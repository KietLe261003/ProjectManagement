
export interface SubTask{
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
	/**	Task : Link - Task	*/
	task?: string
	/**	Status : Select	*/
	status: "Open" | "Working" | "Completed"
	/**	Progress : Percent	*/
	progress?: number
	/**	Start Date : Date	*/
	start_date?: string
	/**	End Date : Date	*/
	end_date?: string
	/**	Description : Small Text	*/
	description?: string
}