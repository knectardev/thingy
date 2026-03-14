import nodemailer from "nodemailer";
import { log } from "@/lib/logger";

const APP_URL = "https://thingy-eta.vercel.app/";

async function handleGmail(
  content: string,
  thingyId: number,
  recipientEmail: string
): Promise<void> {
  await log(thingyId, `[Gmail] Sending to ${recipientEmail}`, "started");

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    await log(
      thingyId,
      "[Gmail] Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars",
      "failed"
    );
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: user,
      to: recipientEmail,
      subject: content,
      text: `Sent via Thingy capture\n\nCapture ID: ${thingyId}\nView activity: ${APP_URL}`,
    });

    await log(thingyId, `[Gmail] Email sent to ${recipientEmail}`, "completed");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await log(thingyId, `[Gmail] Error: ${message}`, "failed");
  }
}

export const emailChris = (content: string, thingyId: number) =>
  handleGmail(content, thingyId, "chris.amato@knectar.com");

export const emailAlana = (content: string, thingyId: number) =>
  handleGmail(content, thingyId, "alana.kaczmarek@gmail.com");
