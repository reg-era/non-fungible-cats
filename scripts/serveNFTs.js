import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve NFTs/cat folder
app.use(
    "/cats",
    express.static(path.join(__dirname, "../NFTs/"))
);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Serving cat images at http://localhost:${PORT}/cats`);
});
