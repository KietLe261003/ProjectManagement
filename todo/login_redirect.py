import frappe
from frappe.utils import get_url

@frappe.whitelist()
def get_home_page():
    """Custom home page logic after login"""
    user = frappe.session.user
    
    # Administrator goes to default ERPNext home
    if user == "Administrator":
        return "/app"
    
    # All other users go to todo app
    return "/todo"
