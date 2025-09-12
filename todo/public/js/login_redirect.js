// Client-side redirect for non-Administrator users accessing /app
(function() {
    'use strict';
    
    // Only proceed if we're on an app page
    if (!window.location.pathname.startsWith('/app')) {
        return;
    }
    
    console.log('Access control script loaded for:', window.location.pathname);
    
    // Function to check user permissions
    function checkUserPermissions() {
        try {
            // Check if frappe and session are available
            if (typeof frappe !== 'undefined' && frappe.session && frappe.session.user) {
                const user = frappe.session.user;
                console.log('Current user:', user);
                
                // Allow Administrator to access /app
                if (user === 'Administrator') {
                    console.log('Administrator access granted');
                    return;
                }
                
                // Show access denied message and redirect
                console.log('Access denied for user:', user);
                
                // Show a brief message before redirect
                if (document.body) {
                    const messageDiv = document.createElement('div');
                    messageDiv.innerHTML = `
                        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                                    background: white; z-index: 10000; display: flex; 
                                    align-items: center; justify-content: center; flex-direction: column;">
                            <div style="text-align: center; padding: 20px;">
                                <h2 style="color: #e74c3c; margin-bottom: 10px;">⚠️ Truy cập bị từ chối</h2>
                                <p style="color: #666; margin-bottom: 15px;">Bạn không có quyền truy cập trang này.</p>
                                <p style="color: #666; margin-bottom: 20px;">Chỉ Administrator mới được phép truy cập.</p>
                                <p style="color: #3498db;">Đang chuyển hướng về Todo App...</p>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(messageDiv);
                }
                
                // Redirect after a short delay
                setTimeout(function() {
                    window.location.replace('/todo');
                }, 2000);
                
                return;
            }
            
            // If session not ready, try again
            setTimeout(checkUserPermissions, 200);
            
        } catch (error) {
            console.error('Error checking user permissions:', error);
            // Try again on error
            setTimeout(checkUserPermissions, 500);
        }
    }
    
    // Start checking when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(checkUserPermissions, 100);
        });
    } else {
        setTimeout(checkUserPermissions, 100);
    }
    
})();
