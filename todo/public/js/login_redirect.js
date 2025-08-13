// Simple client-side redirect for non-Administrator users
window.addEventListener('load', function() {
    // Add some delay to ensure everything is loaded
    setTimeout(function() {
        console.log('Login redirect script loaded');
        console.log('Current path:', window.location.pathname);
        console.log('Frappe available:', typeof frappe !== 'undefined');
        
        // Only proceed if we're on an app page
        if (window.location.pathname.startsWith('/app')) {
            console.log('On app page, checking user...');
            
            // Wait for frappe session to be available
            const checkUser = function() {
                if (frappe && frappe.session && frappe.session.user) {
                    const user = frappe.session.user;
                    console.log('User found:', user);
                    
                    // Skip redirect for Administrator
                    if (user === 'Administrator') {
                        console.log('Administrator - no redirect');
                        return;
                    }
                    
                    // Redirect other users to todo
                    console.log('Redirecting to /todo');
                    window.location.href = '/todo';
                } else {
                    console.log('Frappe session not ready, retrying...');
                    setTimeout(checkUser, 100);
                }
            };
            
            checkUser();
        }
    }, 1000);
});
