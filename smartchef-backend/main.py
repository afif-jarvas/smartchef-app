import os
import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List

# IMPOR RESMI LAYANAN GCP TERBARU & MODUL OTENTIKASI INTERNAL
from google import genai
from google.genai import types
from google.auth import default

app = FastAPI()

# Konfigurasi CORS agar frontend bisa mengakses backend dengan aman
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ambil kredensial dan project_id otomatis dari environment Cloud Shell
credentials, project_id = default()

# Inisialisasi Client Baru menggunakan kredensial Google Cloud Platform (GCP)
ai_client = genai.Client(vertexai=True, project=project_id, location="us-central1")

# Menggunakan model flagship terbaru yang mendukung analisis gambar (Multimodal Vision)
MODEL_NAME = "gemini-2.5-flash"


# ══════════════════════════════════════════════════
# SKEMA PYDANTIC (VALIDASI DATA DATA STRUKTUR AI)
# ══════════════════════════════════════════════════

# 1. Skema untuk Deteksi Bahan Gambar (Tahap 1)
class IngredientDetail(BaseModel):
    nama: str = Field(description="Nama bahan makanan spesifik dalam Bahasa Indonesia. Contoh: 'Wortel', 'Telur', 'Tomat'.")
    jumlah: str = Field(description="Perkiraan jumlah atau takaran yang terlihat di foto. Contoh: '3 buah', '12 butir', 'Secukupnya'.")

class DetectedIngredients(BaseModel):
    ingredients: List[IngredientDetail] = Field(description="Daftar detail bahan-bahan makanan hasil analisis gambar.")


# 2. Skema untuk Request dari Frontend
class IngredientList(BaseModel):
    items: list[str]


# 3. Skema untuk Pembuatan 3 Opsi Resep Masakan (Tahap 2)
class RecipeDetail(BaseModel):
    difficulty: str = Field(description="Tingkat kesulitan masakan. Wajib bernilai salah satu dari: 'Mudah', 'Sedang', atau 'Sulit'.")
    title: str = Field(description="Nama atau judul resep masakan kreatif dalam Bahasa Indonesia.")
    description: str = Field(description="Deskripsi singkat atau daya tarik masakan ini dalam 1 kalimat pembuka.")
    ingredients: List[str] = Field(description="Daftar bahan-bahan beserta takarannya yang dibutuhkan untuk resep ini.")
    steps: List[str] = Field(description="Langkah-langkah pembuatan atau instruksi memasak berurutan.")

class MultiRecipeResponse(BaseModel):
    recipes: List[RecipeDetail] = Field(description="Daftar berisi tepat 3 rekomendasi resep masakan dengan tingkat kesulitan berbeda.")


# ══════════════════════════════════════════════════
# TAHAP 1: GEMINI MULTIMODAL DIRECT VISION ANALYSIS
# ══════════════════════════════════════════════════
@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        content = await file.read()
        mime_type = file.content_type  # Menangkap jenis file gambar (image/jpeg atau image/png)

        print("\n[STEP 1] Mengirim gambar langsung ke Gemini Multimodal Vision...")
        
        # Menyusun objek part gambar untuk SDK GenAI yang baru
        image_part = types.Part.from_bytes(
            data=content,
            mime_type=mime_type,
        )

        filter_prompt = """
        Analisis foto isi kulkas atau bahan makanan ini dengan sangat detail dan teliti.
        
        TUGAS ANDA:
        1. Identifikasi semua nama bahan makanan spesifik yang dapat Anda lihat (seperti: Wortel, Tomat, Telur, Sosis, Susu, Kentang, Cabai, dsb). Jangan gunakan kata generalisasi umum seperti 'Sayuran' atau 'Buah'.
        2. Lakukan penghitungan atau estimasi jumlah/takaran dari masing-masing bahan yang tampak jelas di foto (Contoh: jika melihat barisan telur, perkirakan jumlahnya seperti '12 butir'; jika melihat potongan wortel, tulis '3 buah' atau '1 mangkuk').
        3. Terjemahkan dan kemas seluruh nama bahan ke dalam Bahasa Indonesia yang biasa digunakan sehari-hari.
        4. Masukkan hasilnya ke dalam struktur JSON sesuai dengan response_schema yang diminta (terdiri dari properti 'nama' dan 'jumlah'). Jangan biarkan list 'ingredients' kosong jika gambar berisi makanan.
        """

        # Memanggil Gemini untuk memproses teks prompt sekaligus file gambar mentah
        gemini_response = ai_client.models.generate_content(
            model=MODEL_NAME,
            contents=[image_part, filter_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DetectedIngredients,
                temperature=0.2, # Rendah agar model fokus mendeteksi objek nyata, bukan berimajinasi
            ),
        )
        
        clean_json = gemini_response.text.strip()
        print(f"💚 GEMINI VISION RESPONSE RAW: {clean_json}")

        data_json = json.loads(clean_json)
        raw_ingredients = data_json.get("ingredients", [])

        # Mengembalikan daftar komponen bahan berupa objek list ke frontend
        return {"labels": raw_ingredients}

    except Exception as e:
        print(f"❌ EXCEPTION UTAMA TERJADI DI /UPLOAD: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal menganalisis gambar: {str(e)}")


# ══════════════════════════════════════════════════
# TAHAP 2: GEMINI GENERATE 3 OPSI RESEP MASAKAN
# ══════════════════════════════════════════════════
@app.post("/ai-recipe")
async def generate_recipe(data: IngredientList):
    try:
        ingredients_str = ", ".join(data.items)
        print(f"\n[STEP 2] Meminta 3 opsi resep berdasar kesulitan ke Gemini AI untuk bahan: {ingredients_str}...")
        
        prompt = f"""
        Anda adalah koki profesional yang mahir dalam membuat variasi masakan Nusantara maupun Internasional.
        Buatkan tepat 3 buah rekomendasi resep masakan yang berbeda, realistis, dan lezat berdasarkan daftar bahan yang tersedia ini: {ingredients_str}.
        
        Ketiga resep tersebut wajib dibagi secara terstruktur berdasarkan klasifikasi tingkat kesulitan berikut:
        1. "Mudah" (Proses kilat, langkah pembuatan sedikit/sederhana, alat memasak minimal)
        2. "Sedang" (Membutuhkan waktu memasak standar atau teknik pengolahan/tumis/rebus biasa)
        3. "Sulit" (Membutuhkan pengerjaan lebih kompleks, kombinasi rasa mendalam, bumbu halus, atau waktu masak yang lama)
        
        INSTRUKSI BAHASA (MUTLAK): 
        Seluruh konten di dalam resep (judul, deskripsi, takaran bahan, dan langkah) WAJIB menggunakan BAHASA INDONESIA yang baik, baku, dan mudah dipahami. Jangan ada istilah bahasa Inggris di dalam nilai properti JSON-nya.
        
        INSTRUKSI FORMAT: Kembalikan jawaban murni dalam format struktur JSON yang selaras dengan response_schema MultiRecipeResponse.
        """
        
        response = ai_client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MultiRecipeResponse,
                temperature=0.75 # Diatur agak tinggi agar variasi ide masakan antar level kesulitan lebih variatif dan kreatif
            )
        )
        clean_text = response.text.strip()
        print(f"💚 GEMINI 3 OPSI RESEP RAW: {clean_text}")
            
        recipes_json = json.loads(clean_text)
        print("💚 PROSES SELESAI - 3 Opsi resep sukses dikirim ke frontend!\n")
        return recipes_json

    except json.JSONDecodeError as json_err:
        print(f"❌ ERROR - Gemini tidak mengembalikan format JSON valid saat membuat 3 opsi resep: {str(json_err)}")
        raise HTTPException(status_code=500, detail="Gemini AI tidak mengembalikan format JSON resep yang valid.")
    except Exception as e:
        print(f"❌ EXCEPTION UTAMA TERJADI DI /AI-RECIPE: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal memproses Gemini AI API: {str(e)}")


# ══════════════════════════════════════════════════
# ROUTE TERAKHIR: SERVING FRONTEND STATIC FILES
# ══════════════════════════════════════════════════
app.mount("/", StaticFiles(directory="../smartchef-frontend", html=True), name="frontend")