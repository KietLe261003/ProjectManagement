import type { Project, Task, Timesheet } from '../types';

export const generateFakeData = () => {
  const projects: Project[] = [];
  const tasks: Task[] = [];
  const timesheets: Timesheet[] = [];
  const projectTypes = ["Nội bộ", "Khách hàng"];
  const statuses = ["Đang thực hiện", "Hoàn thành", "Hủy", "Đang xem xét"];
  const priorities = ["Thấp", "Trung bình", "Cao", "Khẩn cấp"];
  const users = ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D"];

  // Tạo dữ liệu dự án
  for (let i = 1; i <= 10; i++) {
    const is_active = Math.random() > 0.3;
    const percent_complete = is_active ? Math.floor(Math.random() * 90) : 100;
    const project_cost = Math.floor(Math.random() * 100000000) + 10000000;
    const estimated_hours = Math.floor(Math.random() * 500) + 50;
    const total_hours = Math.floor(Math.random() * estimated_hours * 1.2);
    const total_billable_amount = Math.floor(Math.random() * project_cost * 0.8);
    const total_billed_amount = Math.floor(Math.random() * total_billable_amount);
    const gross_margin = total_billed_amount - (project_cost * 0.7);

    const startDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const endDate = new Date(startDate.getTime() + (Math.floor(Math.random() * 180) + 30) * 24 * 60 * 60 * 1000);
    const actualStartDate = new Date(startDate.getTime() + (Math.random() > 0.5 ? 0 : -7) * 24 * 60 * 60 * 1000);
    const actualEndDate = percent_complete === 100 ? new Date(endDate.getTime() + (Math.random() > 0.5 ? 0 : 7) * 24 * 60 * 60 * 1000) : null;

    projects.push({
      name: `PROJ-${1000 + i}`,
      project_name: `Dự án ${i}`,
      project_type: projectTypes[Math.floor(Math.random() * projectTypes.length)],
      status: is_active ? statuses[Math.floor(Math.random() * 3)] : "Hoàn thành",
      customer: `Khách hàng ${Math.floor(Math.random() * 5) + 1}`,
      company: "Công ty ABC",
      expected_start_date: startDate.toISOString().split('T')[0],
      expected_end_date: endDate.toISOString().split('T')[0],
      actual_start_date: actualStartDate.toISOString().split('T')[0],
      actual_end_date: actualEndDate ? actualEndDate.toISOString().split('T')[0] : null,
      percent_complete: percent_complete,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      project_cost: project_cost,
      total_billable_amount: total_billable_amount,
      total_billed_amount: total_billed_amount,
      gross_margin: gross_margin,
      estimated_hours: estimated_hours,
      total_hours: total_hours,
      is_active: is_active,
    });
  }

  // Tạo dữ liệu nhiệm vụ theo cấu trúc cây
  projects.forEach(project => {
    const numPhases = Math.floor(Math.random() * 2) + 1;
    for (let i = 1; i <= numPhases; i++) {
      const phaseName = `Giai đoạn ${i} - ${project.project_name}`;
      const phase: Task = {
        name: `TASK-${10000 + tasks.length + 1}`,
        subject: phaseName,
        project: project.project_name,
        status: statuses[Math.floor(Math.random() * 3)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        type: 'Giai đoạn',
        expected_time: Math.floor(Math.random() * 80) + 20,
        actual_time: 0,
        start_date: project.expected_start_date,
        end_date: project.expected_end_date,
        progress: Math.floor(Math.random() * 70),
        assigned_to: null,
        is_group: true,
        parent_task_name: null
      };
      tasks.push(phase);

      const numTasksInPhase = Math.floor(Math.random() * 4) + 2;
      for (let j = 1; j <= numTasksInPhase; j++) {
        const taskStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const expectedTime = Math.floor(Math.random() * 20) + 5;
        const actualTime = taskStatus === "Hoàn thành" ? Math.floor(Math.random() * expectedTime * 1.2) : Math.floor(Math.random() * expectedTime);
        const progress = taskStatus === "Hoàn thành" ? 100 : Math.floor(Math.random() * 99);

        const taskStartDate = new Date(phase.start_date);
        const taskEndDate = new Date(taskStartDate.getTime() + (Math.floor(Math.random() * 10) + 2) * 24 * 60 * 60 * 1000);

        const task: Task = {
          name: `TASK-${10000 + tasks.length + 1}`,
          subject: `Nhiệm vụ ${j} - ${phaseName}`,
          project: project.project_name,
          status: taskStatus,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          type: `Loại nhiệm vụ ${Math.floor(Math.random() * 3) + 1}`,
          expected_time: expectedTime,
          actual_time: actualTime,
          start_date: taskStartDate.toISOString().split('T')[0],
          end_date: taskEndDate.toISOString().split('T')[0],
          progress: progress,
          assigned_to: users[Math.floor(Math.random() * users.length)],
          is_group: false,
          parent_task_name: phaseName
        };
        tasks.push(task);

        if (Math.random() > 0.6) {
          const numSubtasks = Math.floor(Math.random() * 2) + 1;
          for (let k = 1; k <= numSubtasks; k++) {
            const subtaskStatus = statuses[Math.floor(Math.random() * statuses.length)];
            const subExpectedTime = Math.floor(Math.random() * 10) + 2;
            const subActualTime = subtaskStatus === "Hoàn thành" ? Math.floor(Math.random() * subExpectedTime * 1.2) : Math.floor(Math.random() * subExpectedTime);
            const subProgress = subtaskStatus === "Hoàn thành" ? 100 : Math.floor(Math.random() * 99);

            const subtaskStartDate = new Date(task.start_date);
            const subtaskEndDate = new Date(subtaskStartDate.getTime() + (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000);

            tasks.push({
              name: `TASK-${10000 + tasks.length + 1}`,
              subject: `Nhiệm vụ con ${k} - ${task.subject}`,
              project: project.project_name,
              status: subtaskStatus,
              priority: priorities[Math.floor(Math.random() * priorities.length)],
              type: `Loại nhiệm vụ con`,
              expected_time: subExpectedTime,
              actual_time: subActualTime,
              start_date: subtaskStartDate.toISOString().split('T')[0],
              end_date: subtaskEndDate.toISOString().split('T')[0],
              progress: subProgress,
              assigned_to: users[Math.floor(Math.random() * users.length)],
              is_group: false,
              parent_task_name: task.subject
            });
          }
        }
      }
    }

    if (Math.random() > 0.5) {
      const numDirectTasks = Math.floor(Math.random() * 2) + 1;
      for (let i = 1; i <= numDirectTasks; i++) {
        const taskStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const expectedTime = Math.floor(Math.random() * 30) + 10;
        const actualTime = taskStatus === "Hoàn thành" ? Math.floor(Math.random() * expectedTime * 1.2) : Math.floor(Math.random() * expectedTime);
        const progress = taskStatus === "Hoàn thành" ? 100 : Math.floor(Math.random() * 99);

        const startDate = new Date(project.expected_start_date);
        const taskStartDate = new Date(startDate.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        const taskEndDate = new Date(taskStartDate.getTime() + (Math.floor(Math.random() * 20) + 5) * 24 * 60 * 60 * 1000);

        tasks.push({
          name: `TASK-${10000 + tasks.length + 1}`,
          subject: `Nhiệm vụ trực tiếp ${i} - ${project.project_name}`,
          project: project.project_name,
          status: taskStatus,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          type: `Loại nhiệm vụ`,
          expected_time: expectedTime,
          actual_time: actualTime,
          start_date: taskStartDate.toISOString().split('T')[0],
          end_date: taskEndDate.toISOString().split('T')[0],
          progress: progress,
          assigned_to: users[Math.floor(Math.random() * users.length)],
          is_group: false,
          parent_task_name: null
        });
      }
    }
  });

  // Tạo dữ liệu Timesheet
  for (let i = 1; i <= 20; i++) {
    const employee = users[Math.floor(Math.random() * users.length)];
    const project = projects[Math.floor(Math.random() * projects.length)].project_name;
    const task = tasks[Math.floor(Math.random() * tasks.length)].subject;
    const totalHours = Math.floor(Math.random() * 8) + 1;
    const billable = Math.random() > 0.2;
    const billingHours = billable ? totalHours : 0;
    const billingRate = Math.floor(Math.random() * 500000) + 100000;
    const billingAmount = billingHours * billingRate;

    const timesheetDate = new Date(2024, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1);

    timesheets.push({
      name: `TS-${2000 + i}`,
      employee: employee,
      project: project,
      task: task,
      start_date: timesheetDate.toISOString().split('T')[0],
      end_date: timesheetDate.toISOString().split('T')[0],
      total_hours: totalHours,
      billable: billable,
      billing_hours: billingHours,
      billing_rate: billingRate,
      billing_amount: billingAmount,
    });
  }

  return { projects, tasks, timesheets };
};
