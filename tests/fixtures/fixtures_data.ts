import fs from "fs";
import path from "path";

export const FIXTURE_USER_A = {
  email: "qa_owner_a@ordermind.pack",
  password: "Password123!",
  name: "Ishan QA",
  businessName: "InTheBox Production Studio",
  industry: "Custom Luxury Packaging",
};

export const FIXTURE_USER_B = {
  email: "qa_tenant_b@ordermind.pack",
  password: "Password123!",
  name: "Competitor Pack",
  businessName: "Delta Boxes Ltd",
  industry: "Corrugated Packaging",
};

export const FIXTURE_CLIENT_1 = {
  name: "Aarav Cosmetics",
  industry: "Organic Cosmetics",
  contacts: [{ name: "Aarav Patel", phone: "+91 98765 43210", role: "Founder" }],
  requirements: "350 GSM White SBS rigid box, gold foil stamping, custom EVA foam tray",
};

export const FIXTURE_CLIENT_2 = {
  name: "Mehta Naturals",
  industry: "E-commerce Wellness",
  contacts: [{ name: "Rajesh Mehta", phone: "+91 98234 56789", role: "Supply Head" }],
  requirements: "3-ply E-flute corrugated mailer box, soy ink black print",
};

/**
 * Ensures media files exist in tests/fixtures directory with valid magic byte signatures.
 */
export function ensureMediaFixtures() {
  const fixturesDir = path.resolve(__dirname);
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // 1. Valid PNG Image fixture
  const pngPath = path.join(fixturesDir, "sample_packaging_mockup.png");
  if (!fs.existsSync(pngPath)) {
    // 1x1 transparent PNG binary bytes
    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(pngPath, pngBytes);
  }

  // 2. Valid PDF Spec Sheet fixture
  const pdfPath = path.join(fixturesDir, "sample_dieline_spec.pdf");
  if (!fs.existsSync(pdfPath)) {
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (InTheBox Dieline Spec 250x180x80) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000202 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
298
%%EOF`;
    fs.writeFileSync(pdfPath, Buffer.from(pdfContent, "utf-8"));
  }

  // 3. Valid MP3 Audio fixture
  const mp3Path = path.join(fixturesDir, "sample_voicenote.mp3");
  if (!fs.existsSync(mp3Path)) {
    // Valid ID3v2 header + dummy frame sync
    const mp3Bytes = Buffer.concat([
      Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a]),
      Buffer.from("TIT2\x00\x00\x00\x01\x00\x00\x00", "binary"),
      Buffer.from([0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00]),
    ]);
    fs.writeFileSync(mp3Path, mp3Bytes);
  }
}
