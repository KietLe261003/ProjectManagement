import frappe
import os

def on_login(login_manager):
    """Handle login redirect"""
    user = frappe.session.user
    
    # Skip redirect for Guest user or Administrator
    if user in ["Guest", "Administrator"]:
        return
    
    # For all other users, redirect to todo app
    try:
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = "/todo"
    except Exception as e:
        frappe.log_error(f"Error in on_login redirect: {str(e)}", "Login Redirect Error")

def on_session_creation(login_manager):
    """Handle session creation and redirect logic"""
    user = frappe.session.user
    
    # Skip redirect for Guest user
    if user == "Guest":
        return
    
    # Only Administrator gets default ERPNext behavior
    if user == "Administrator":
        return
    
    # For all other users, redirect to todo app
    try:
        # Ensure response object exists and is a dict
        if not hasattr(frappe.local, 'response') or frappe.local.response is None:
            frappe.local.response = {}
        
        # Set redirect response
        frappe.local.response["type"] = "redirect" 
        frappe.local.response["location"] = "/todo"
        
    except Exception as e:
        # Log error but don't break the login process
        frappe.log_error(f"Error in redirect logic: {str(e)}", "Login Redirect Error")
