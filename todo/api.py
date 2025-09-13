import frappe
from frappe import _

@frappe.whitelist()
def get_current_user_roles():
    """Get roles of current user - accessible by any authenticated user"""
    try:
        user = frappe.session.user
        if not user or user == "Guest":
            return {
                "success": False,
                "message": "User not authenticated"
            }
            
        user_roles = frappe.get_roles(user)
        
        result = {
            "success": True,
            "user": user,
            "roles": user_roles,
            "has_projects_manager": "Projects Manager" in user_roles,
            "is_administrator": user == "Administrator" or "Administrator" in user_roles
        }
        
        frappe.logger().info(f"User roles retrieved for {user}: {result}")
        return result
        
    except Exception as e:
        error_msg = str(e)
        frappe.log_error(frappe.get_traceback(), "Get User Roles Error")
        frappe.logger().error(f"Error getting user roles: {error_msg}")
        return {
            "success": False,
            "message": error_msg,
            "error_type": type(e).__name__
        }

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

@frappe.whitelist()
def add_project_member(project_name, user, view_attachments=0, hide_timesheets=0, project_status=""):
    """Add a member to project without sending welcome email"""
    try:
        # Check if project exists
        if not frappe.db.exists("Project", project_name):
            frappe.throw(_("Project {0} does not exist").format(project_name))
        
        # Check if user exists  
        if not frappe.db.exists("User", user):
            frappe.throw(_("User {0} does not exist").format(user))
        
        # Get the project document
        project = frappe.get_doc("Project", project_name)
        
        # Check if user is already a member
        existing_user = None
        for member in project.users:
            if member.user == user:
                existing_user = member
                break
        
        if existing_user:
            frappe.throw(_("User {0} is already a member of this project").format(user))
        
        # Add new member
        project.append("users", {
            "user": user,
            "view_attachments": int(view_attachments) if view_attachments else 0,
            "hide_timesheets": int(hide_timesheets) if hide_timesheets else 0,
            "project_status": project_status or "Team Member"
        })
        
        # Save without triggering email by temporarily overriding the method
        original_send_welcome_email = project.send_welcome_email
        project.send_welcome_email = lambda: None  # Disable email sending
        
        try:
            project.save(ignore_permissions=False)
            frappe.db.commit()
        finally:
            # Restore original method
            project.send_welcome_email = original_send_welcome_email
        
        return {
            "success": True,
            "message": _("Member added successfully")
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Add Project Member Error")
        frappe.throw(str(e))

@frappe.whitelist()
def remove_project_member(project_name, user):
    """Remove a member from project without sending notification email"""
    try:
        # Check if project exists
        if not frappe.db.exists("Project", project_name):
            frappe.throw(_("Project {0} does not exist").format(project_name))
        
        # Check if user exists  
        if not frappe.db.exists("User", user):
            frappe.throw(_("User {0} does not exist").format(user))
        
        # Get the project document
        project = frappe.get_doc("Project", project_name)
        
        # Find and remove the user
        member_to_remove = None
        for i, member in enumerate(project.users):
            if member.user == user:
                member_to_remove = i
                break
        
        if member_to_remove is None:
            frappe.throw(_("User {0} is not a member of this project").format(user))
        
        # Remove the member
        project.users.pop(member_to_remove)
        
        # Save without triggering any notification emails
        project.flags.ignore_validate = True
        project.flags.ignore_mandatory = True
        
        try:
            project.save(ignore_permissions=False)
            frappe.db.commit()
        except Exception as save_error:
            frappe.log_error(f"Error saving project after removing member: {str(save_error)}")
            # Try direct database delete as fallback
            frappe.db.sql("""
                DELETE FROM `tabProject User` 
                WHERE parent = %s AND user = %s
            """, (project_name, user))
            frappe.db.commit()
        
        return {
            "success": True,
            "message": _("Member removed successfully")
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Remove Project Member Error")
        frappe.throw(str(e))
