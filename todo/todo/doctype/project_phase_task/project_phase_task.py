# Copyright (c) 2025, Frappe Technologies and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ProjectPhaseTask(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		end_date: DF.Date | None
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		progress: DF.Percent
		start_date: DF.Date | None
		status: DF.Literal["Open", "Working", "Completed"]
		subject: DF.Data | None
		task: DF.Link | None
	# end: auto-generated types

	pass
