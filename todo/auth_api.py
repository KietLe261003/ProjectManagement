import frappe
from frappe import _
from frappe.utils import get_url
import json

@frappe.whitelist(allow_guest=True)
def todo_login(usr, pwd, remember_me=0):
    """Custom login API for Todo app"""
    try:
        # Initialize login manager
        login_manager = frappe.auth.LoginManager()
        
        # Authenticate user
        login_manager.authenticate(user=usr, pwd=pwd)
        login_manager.post_login()
        
        # Set remember me cookie if requested
        if frappe.utils.cint(remember_me):
            frappe.local.cookie_manager.set_cookie("remember_me", "1", expires=365*24*60*60)
        
        # Check user permissions
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Login failed"))
            
        # Prepare response
        response = {
            "message": "success",
            "user": user,
            "redirect_to": "/todo" if user != "Administrator" else "/app"
        }
        
        return response
        
    except frappe.exceptions.AuthenticationError:
        frappe.local.response["http_status_code"] = 401
        frappe.throw(_("Tên đăng nhập hoặc mật khẩu không đúng"))
        
    except Exception as e:
        frappe.log_error(f"Login error: {str(e)}", "Todo Login Error")
        frappe.local.response["http_status_code"] = 500
        frappe.throw(_("Đã xảy ra lỗi trong quá trình đăng nhập"))

@frappe.whitelist(allow_guest=True)
def get_login_status():
    """Check current login status"""
    user = frappe.session.user
    
    if user and user != "Guest":
        return {
            "logged_in": True,
            "user": user,
            "redirect_to": "/todo" if user != "Administrator" else "/app"
        }
    else:
        return {
            "logged_in": False
        }

@frappe.whitelist()
def todo_logout():
    """Custom logout for Todo app"""
    try:
        frappe.local.login_manager.logout()
        return {
            "message": "success",
            "redirect_to": "/login"
        }
    except Exception as e:
        frappe.log_error(f"Logout error: {str(e)}", "Todo Logout Error")
        frappe.throw(_("Đã xảy ra lỗi trong quá trình đăng xuất"))
