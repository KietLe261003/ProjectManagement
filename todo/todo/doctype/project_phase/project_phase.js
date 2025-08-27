// Copyright (c) 2025, KietLe and contributors
// For license information, please see license.txt

frappe.ui.form.on('project_phase', {
    refresh: function(frm) {
        // Add custom buttons or functionality if needed
        if (frm.doc.tasks && frm.doc.tasks.length > 0) {
            frm.add_custom_button(__('Update Progress'), function() {
                update_phase_progress(frm);
            });
        }
    },
    
    tasks_on_form_rendered: function(frm) {
        // Auto-calculate progress based on tasks
        update_phase_progress(frm);
    }
});

frappe.ui.form.on('Project Phase Task', {
    progress: function(frm, cdt, cdn) {
        // Auto-update phase progress when task progress changes
        update_phase_progress(frm);
    },
    
    status: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        // Auto-set progress based on status
        if (row.status === 'Completed') {
            frappe.model.set_value(cdt, cdn, 'progress', 100);
        } else if (row.status === 'Open') {
            frappe.model.set_value(cdt, cdn, 'progress', 0);
        }
        update_phase_progress(frm);
    }
});

function update_phase_progress(frm) {
    if (!frm.doc.tasks || frm.doc.tasks.length === 0) {
        return;
    }
    
    let total_progress = 0;
    let total_tasks = frm.doc.tasks.length;
    
    frm.doc.tasks.forEach(function(task) {
        total_progress += (task.progress || 0);
    });
    
    let average_progress = total_progress / total_tasks;
    frm.set_value('progress', average_progress);
}