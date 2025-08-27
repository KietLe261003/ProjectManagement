import type { table_user } from './table_user'

export interface Team{
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
	/**	Team : Data	*/
	team?: string
	/**	Department : Link - Department	*/
	department?: string
	/**	User Table : Table - table_user	*/
	user_table?: table_user[]
}