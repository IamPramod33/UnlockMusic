# TODOs

## Milestone 1.2 follow-ups

- Email delivery for verification and password reset (Pending)
  - Integrate an email provider (Resend/SendGrid/Postmark)
  - Add provider secrets to server/.env (e.g., RESEND_API_KEY)
  - Implement mailer utility with templates for:
    - Verify email (link with verifyToken)
    - Password reset (link with resetToken)
  - Update register to send verification email instead of returning token in response
  - Update request-password-reset to send email with reset link
  - Optional: add a simple "Verify Email" screen/CTA in client and handle verified state in UI

## Nice-to-haves (security & UX)

- Stronger password validation and client-side form validation
- Role-based UI (hide admin/teacher features unless authorized)
- Session audit and an Admin tool to revoke individual sessions
- Unit/integration tests (server auth flows) and basic e2e happy paths


