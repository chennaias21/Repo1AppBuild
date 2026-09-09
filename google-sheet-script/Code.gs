/**
 * Excel Mastery — admin tracking sheet receiver.
 *
 * Paste this whole file into Extensions → Apps Script on your tracking Sheet,
 * change SHARED_SECRET below, then deploy it as a Web App. Full instructions
 * are in SETUP.md, Step 4.
 *
 * The website calls this script whenever someone registers, pays, or is
 * refunded. It keeps one row per customer, updating that row as their status
 * changes rather than adding duplicates.
 */

// ▶ Replace this with the same random text you put in SHEETS_WEBHOOK_SECRET.
const SHARED_SECRET = 'PASTE_YOUR_SECRET_HERE';

const SHEET_NAME = 'Registrations';

const HEADERS = [
  'Name',
  'Email',
  'Mobile',
  'Registration Date',
  'Payment Status',
  'Payment ID',
  'Payment Date',
  'Course Access Status',
];

function doPost(request) {
  try {
    const body = JSON.parse(request.postData.contents);

    if (!SHARED_SECRET || body.secret !== SHARED_SECRET) {
      return reply({ ok: false, error: 'unauthorized' });
    }

    const record = body.record || {};
    if (!record.email) {
      return reply({ ok: false, error: 'missing email' });
    }

    const sheet = getSheet();
    const email = String(record.email).trim().toLowerCase();
    const row = [
      record.name || '',
      email,
      record.mobile || '',
      record.registrationDate || '',
      record.paymentStatus || '',
      record.paymentId || '',
      record.paymentDate || '',
      record.accessStatus || '',
    ];

    const existingRow = findRowByEmail(sheet, email);

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return reply({ ok: true });
  } catch (error) {
    return reply({ ok: false, error: String(error) });
  }
}

/** Lets you confirm the deployment is live by opening the URL in a browser. */
function doGet() {
  return reply({ ok: true, message: 'Excel Mastery sheet receiver is running.' });
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function findRowByEmail(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues();

  for (let i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === String(email).trim().toLowerCase()) {
      return i + 2;
    }
  }

  return -1;
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
