import frappe
from frappe import _
from frappe.utils import get_url
import json

def get_context(context):
    """Context for login page"""
    # Check if user is already logged in
    if frappe.session.user != 'Guest':
        # Redirect logged in users to todo app
        frappe.local.flags.redirect_location = '/todo'
        raise frappe.Redirect
    
    context.no_cache = 1
    context.show_sidebar = False
    
    # Add any custom context for the login page
    context.title = "Todo - Login"
    context.app_name = "Todo Management System"
    
    return context

@frappe.whitelist(allow_guest=True)
def custom_login(usr, pwd, remember_me=0):
    """Custom login method for todo app"""
    try:
        # Use frappe's built-in login
        frappe.auth.login_as(usr)
        
        # Set remember me if requested
        if remember_me:
            frappe.local.cookie_manager.set_cookie("remember_me", "1", expires=365*24*60*60)
        
        # Return success response
        return {
            "status": "success",
            "message": "Login successful",
            "redirect_to": "/todo"
        }
        
    except frappe.exceptions.AuthenticationError:
        frappe.local.response["http_status_code"] = 401
        return {
            "status": "error", 
            "message": "Tên đăng nhập hoặc mật khẩu không đúng"
        }
    except Exception as e:
        frappe.local.response["http_status_code"] = 500
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist(allow_guest=True)
def check_login_status():
    """Check if user is logged in"""
    if frappe.session.user != 'Guest':
        return {
            "logged_in": True,
            "user": frappe.session.user,
            "redirect_to": "/todo"
        }
    else:
        return {
            "logged_in": False
        }
