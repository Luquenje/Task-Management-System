const nodemailer = require("nodemailer");
require("dotenv").config();

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send email notification to PL users when task moves from Doing to Done
 * @param {Array} plUsers - Array of user objects with email property
 * @param {Object} taskDetails - Task information
 * @param {String} taskDetails.Task_id - Task ID
 * @param {String} taskDetails.Task_name - Task name
 * @param {String} taskDetails.Task_app_Acronym - Application acronym
 * @param {String} taskDetails.Task_owner - Task owner
 * @param {String} taskDetails.note - Note from the user when moving to Done
 * @param {String} taskDetails.username - Username of the person who moved the task
 */
const sendTaskDoneNotification = async (plUsers, taskDetails) => {
  try {
    // Skip if email is not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log("Email not configured. Skipping notification.");
      return { success: true, message: "Email not configured" };
    }

    // Skip if no PL users found
    if (!plUsers || plUsers.length === 0) {
      console.log("No PL users found. Skipping notification.");
      return { success: true, message: "No recipients" };
    }

    // Extract emails from PL users
    const recipientEmails = plUsers
      .map((user) => user.email)
      .filter((email) => email); // Filter out null/undefined emails

    if (recipientEmails.length === 0) {
      console.log("No valid email addresses found for PL users.");
      return { success: true, message: "No valid emails" };
    }

    const transporter = createTransporter();

    // Email content
    const subject = `Task Completed: ${taskDetails.Task_id}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5f6368;">Task Moved to Done</h2>
        <p>A task has been moved to the Done state and is ready for review.</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #5f6368;">Task Details</h3>
          <p><strong>Task ID:</strong> ${taskDetails.Task_id}</p>
          <p><strong>Task Name:</strong> ${taskDetails.Task_name}</p>
          <p><strong>Application:</strong> ${taskDetails.Task_app_Acronym}</p>
          <p><strong>Owner:</strong> ${taskDetails.Task_owner || "Unassigned"}</p>
          <p><strong>Completed By:</strong> ${taskDetails.username || "Unknown"}</p>
        </div>

        ${taskDetails.note ? `
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h3 style="margin-top: 0; color: #1976d2;">Completion Note</h3>
          <p style="white-space: pre-wrap; margin: 0;">${taskDetails.note}</p>
        </div>
        ` : ''}

        <p>Please review this task and approve or reject it accordingly.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          This is an automated notification from the Task Management System.
        </p>
      </div>
    `;

    const textBody = `
Task Moved to Done

A task has been moved to the Done state and is ready for review.

Task Details:
- Task ID: ${taskDetails.Task_id}
- Task Name: ${taskDetails.Task_name}
- Application: ${taskDetails.Task_app_Acronym}
- Owner: ${taskDetails.Task_owner || "Unassigned"}
- Completed By: ${taskDetails.username || "Unknown"}

${taskDetails.note ? `Completion Note:
${taskDetails.note}

` : ''}Please review this task and approve or reject it accordingly.

---
This is an automated notification from the Task Management System.
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Task Management System" <${process.env.EMAIL_FROM}>`,
      to: recipientEmails.join(", "),
      subject: subject,
      text: textBody,
      html: htmlBody,
    });

    console.log("Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      recipients: recipientEmails.length,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw error - we don't want email failures to break the task transition
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTaskDoneNotification,
};
