import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { log } from "@/lib/logger";

const SPREADSHEET_ID = "1OTU37oAUMazJsaHY2DeS3FJ2I6kI88EsJX9fMPDMOaM";

export async function handleSheets(
  content: string,
  thingyId: number
): Promise<void> {
  await log(thingyId, "[Sheets] Handler started", "started");

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    await log(
      thingyId,
      "[Sheets] Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars",
      "failed"
    );
    return;
  }

  try {
    const auth = new JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.addRow({ Text: content, Source: "Thingy PWA" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = String(error).includes("403") || String(error).includes("PERMISSION_DENIED")
      ? "[Sheets] Permission denied -- ensure the Google Sheet is shared with the service account email as Editor"
      : `[Sheets] Error: ${message}`;

    await log(thingyId, status, "failed");
    return;
  }

  await log(thingyId, "[Sheets] Handler completed", "completed");
}
