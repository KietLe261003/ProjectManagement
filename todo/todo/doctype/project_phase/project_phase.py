# Copyright (c) 2025, KietLe and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class project_phase(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF
		from todo.todo.doctype.project_phase_task.project_phase_task import ProjectPhaseTask

		costing: DF.Currency
		department: DF.Link | None
		details: DF.Data | None
		end_date: DF.Date | None
		priority: DF.Literal["Low", "Medium", "High", "Urgent"]
		progress: DF.Percent
		project: DF.Link | None
		start_date: DF.Date | None
		status: DF.Literal["Open", "Working", "Completed"]
		subject: DF.Data | None
		tasks: DF.Table[ProjectPhaseTask]
	# end: auto-generated types

	pass
