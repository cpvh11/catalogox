import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY no está configurado");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: "CatalogoX <noreply@catalogox.com>",
    to,
    subject,
    react,
  });

  if (error) {
    throw new Error(`Error sending email: ${error.message}`);
  }

  return data;
}
