import frappe
from frappe.utils import get_url

@frappe.whitelist()
def get_home_page():
    """Custom home page logic after login"""
    user = frappe.session.user
    
    # Guest users go to login page
    if user == "Guest":
        return "/login"
    
    # Administrator goes to default ERPNext home
    if user == "Administrator":
        return "/app"
    
    # All other users go to todo app
    return "/todo"

@frappe.whitelist(allow_guest=True)
def redirect_after_login():
    """Redirect users after successful login"""
    user = frappe.session.user
    
    if user == "Guest":
        return {"redirect": "/login"}
    elif user == "Administrator":
        return {"redirect": "/app/home"}
    else:
        return {"redirect": "/todo"}
