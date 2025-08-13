import frappe
from frappe import _

@frappe.whitelist(allow_guest=True)
def custom_login(usr, pwd):
    """Custom login with role-based redirect"""
    try:
        # Authenticate user
        frappe.local.login_manager.authenticate(user=usr, pwd=pwd)
        frappe.local.login_manager.post_login()
        
        # Get user info
        user = frappe.session.user
        user_roles = frappe.get_roles(user)
        user_type = frappe.db.get_value("User", user, "user_type")
        
        # Determine redirect URL
        redirect_url = "/app"  # Default ERPNext desk
        
        # Check if user should go to todo app
        admin_roles = ["Administrator", "System Manager"]
        is_admin = any(role in admin_roles for role in user_roles)
        
        if not is_admin and user_type != "System User":
            redirect_url = "/todo"
        
        return {
            "success": True,
            "redirect_url": redirect_url,
            "user": user,
            "user_type": user_type,
            "roles": user_roles
        }
        
    except frappe.exceptions.AuthenticationError:
        return {
            "success": False,
            "message": _("Invalid login credentials")
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Custom Login Error")
        return {
            "success": False,
            "message": _("Login failed. Please try again.")
        }
