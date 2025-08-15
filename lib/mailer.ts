import nodemailer from "nodemailer"
import type { FormSubmission, FormTemplate, User } from "@/types"
import { apiClient } from "./api-client"

interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html: string
}

interface FormSubmissionNotificationOptions {
  submission: FormSubmission
  formTemplate: FormTemplate
  recipients: User[]
  status: string 
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Hệ thống phê duyệt" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text,
      html,
    })

    console.log("Message sent: %s", info.messageId)
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function sendFormSubmissionNotification({
  submission,
  formTemplate,
  recipients,
  status,
}: FormSubmissionNotificationOptions) {
  const statusLabels = {
    approved: "Đã được duyệt",
    rejected: "Đã bị từ chối",
    responded: "Đã được phản hồi",
  }

  const data: User = await apiClient.get(`/api/users/${submission.submitterId}`)

  const subject = `Thông báo: Biểu mẫu "${formTemplate.name}" ${statusLabels[status as keyof typeof statusLabels] || status}`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Thông báo trạng thái biểu mẫu</h2>
      <p><strong>Biểu mẫu:</strong> ${formTemplate.name}</p>
      <p><strong>Trạng thái:</strong> ${statusLabels[status as keyof typeof statusLabels] || status}</p>
      <p><strong>Người gửi:</strong> ${data.name} || "N/A"}</p>
      <p><strong>Ngày gửi:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
      <p><strong>Chi tiết:</strong></p>
      <ul>
        ${Object.entries(submission.data)
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join("")}
      </ul>
      <p>Vui lòng kiểm tra hệ thống để biết thêm chi tiết: <a href="${process.env.NEXTAUTH_URL}/submissions/${submission._id}">Xem biểu mẫu</a></p>
    </div>
  `
  const text = `
    Thông báo trạng thái biểu mẫu
    Biểu mẫu: ${formTemplate.name}
    Trạng thái: ${statusLabels[status as keyof typeof statusLabels] || status}
    Người gửi: ${(submission.submitterId as any)?.name || "N/A"}
    Ngày gửi: ${new Date(submission.createdAt).toLocaleString()}
    Chi tiết:
    ${Object.entries(submission.data)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")}
    Vui lòng kiểm tra hệ thống để biết thêm chi tiết: ${process.env.NEXTAUTH_URL}/submissions/${submission._id}
  `

  const recipientEmails = recipients
    .filter((user) => user.email) // Lọc người dùng có email
    .map((user) => user.email)

  if (recipientEmails.length === 0) {
    console.warn("No valid recipient emails found for notification")
    return
  }

  await sendEmail({
    to: recipientEmails,
    subject,
    text,
    html,
  })
}