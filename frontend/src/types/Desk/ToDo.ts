export interface ToDo{
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
	/**	Status : Select	*/
	status?: "Open" | "Closed" | "Cancelled"
	/**	Priority : Select	*/
	priority?: "High" | "Medium" | "Low"
	/**	Color : Color	*/
	color?: string
	/**	Due Date : Date	*/
	date?: string
	/**	Allocated To : Link - User	*/
	allocated_to?: string
	/**	Description : Text Editor	*/
	description: string
	/**	Reference Type : Link - DocType	*/
	reference_type?: string
	/**	Reference Name : Dynamic Link	*/
	reference_name?: string
	/**	Role : Link - Role	*/
	role?: string
	/**	Assigned By : Link - User	*/
	assigned_by?: string
	/**	Assigned By Full Name : Read Only	*/
	assigned_by_full_name?: string
	/**	Sender : Data	*/
	sender?: string
	/**	Assignment Rule : Link - Assignment Rule	*/
	assignment_rule?: string
}