import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!email || !privateKey) {
  console.error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY");
  process.exit(1);
}

console.log("Service account email:", email);
console.log("Private key length:", privateKey.length);

const auth = new JWT({
  email,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1OTU37oAUMazJsaHY2DeS3FJ2I6kI88EsJX9fMPDMOaM";

try {
  console.log("Connecting to spreadsheet...");
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
  await doc.loadInfo();
  console.log("Spreadsheet title:", doc.title);

  const sheet = doc.sheetsByIndex[0];
  console.log("Sheet title:", sheet.title);
  console.log("Row count:", sheet.rowCount);

  console.log("Appending test row...");
  await sheet.addRow({ Text: "TEST from script", Source: "Thingy PWA" });
  console.log("SUCCESS - Row appended!");
} catch (err) {
  console.error("FAILED:", err.message);
  if (err.response) {
    console.error("Status:", err.response.status);
    console.error("Data:", JSON.stringify(err.response.data, null, 2));
  }
}
