
export interface PhaseDocument{
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
	/**	DocumentName : Data	*/
	documentname: string
	/**	TemplateLink : Attach	*/
	templatelink?: string
	/**	FileUpLoad : Attach	*/
	fileupload?: string
	/**	Status : Select	*/
	status?: "Trống" | "Nháp" | "Chờ Duyệt" | "Đã Duyệt"
}