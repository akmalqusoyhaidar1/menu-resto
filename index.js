import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(express.json());

// Inisialisasi koneksi Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Fungsi untuk menguji koneksi Supabase
async function testSupabaseConnection() {
  try {
    // Coba memanggil API metadata – fetch identitas project
    const { data, error } = await supabase.auth.getUser();

    if (error && !error.message.includes("Auth session missing")) {
      console.error("❌ Gagal terhubung ke Supabase:", error.message);
      return false;
    }

    console.log("✅ Koneksi ke Supabase berhasil (tanpa tabel)");
    return true;
  } catch (err) {
    console.error("❌ Terjadi kesalahan koneksi:", err.message);
    return false;
  }
}

// Route utama
app.get("/", (req, res) => {
  res.send("Server Express.js berjalan 🚀");
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  await testSupabaseConnection();
});
