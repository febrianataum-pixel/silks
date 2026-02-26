import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import multer from "multer";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import "dotenv/config";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

const upload = multer({ dest: 'uploads/' });

// Google Drive Config
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.APP_URL ? `${process.env.APP_URL}/auth/google/callback` : 'http://localhost:3000/auth/google/callback'
);

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Google Auth URL
app.get("/api/auth/google/url", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(400).json({ 
      error: "Konfigurasi Google OAuth belum lengkap. Pastikan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET sudah diatur di Environment Variables." 
    });
  }

  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      prompt: 'consent'
    });
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: "Gagal membuat URL autentikasi Google." });
  }
});

// Google Auth Callback
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    // In a real app, store this in a database linked to the user
    // For this demo, we'll use a cookie (SameSite=None for iframe)
    res.cookie('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).send("Authentication failed");
  }
});

// Upload to Google Drive
app.post("/api/upload/google-drive", upload.single('file'), async (req, res) => {
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const tokens = JSON.parse(tokensStr);
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const fileMetadata = {
      name: req.file.originalname,
      parents: [] // You could specify a folder ID here
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path)
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    // Make file readable by anyone with the link for preview
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Clean up local file
    fs.unlinkSync(req.file.path);

    res.json({
      id: response.data.id,
      viewLink: response.data.webViewLink,
      downloadLink: response.data.webContentLink
    });
  } catch (error) {
    console.error("Drive Upload Error:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Failed to upload to Google Drive" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve("dist/index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
