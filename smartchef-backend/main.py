import os
import json
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List

from google import genai
from google.genai import types
from google.auth import default
from google.cloud import storage

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

credentials, project_id = default()

ai_client = genai.Client(vertexai=True, project=project_id, location="us-central1")
storage_client = storage.Client(project=project_id)

MODEL_NAME = "gemini-2.5-flash"
BUCKET_NAME = "smartchef-uploads"


# ══════════════════════════════════════════════════
# SKEMA PYDANTIC
# ══════════════════════════════════════════════════

class IngredientDetail(BaseModel):
    nama: str = Field(description="Nama bahan makanan spesifik dalam Bahasa Indonesia.")
    jumlah: str = Field(description="Perkiraan jumlah atau takaran yang terlihat di foto.")

class DetectedIngredients(BaseModel):
    ingredients: List[IngredientDetail] = Field(description="Daftar detail bahan-bahan makanan hasil analisis gambar.")

class IngredientList(BaseModel):
    items: list[str]

class RecipeDetail(BaseModel):
    difficulty: str = Field(description="Tingkat kesulitan: 'Mudah', 'Sedang', atau 'Sulit'.")
    title: str = Field(description="Nama resep masakan dalam Bahasa Indonesia.")
    description: str = Field(description="Deskripsi singkat masakan dalam 1 kalimat.")
    ingredients: List[str] = Field(description="Daftar bahan beserta takarannya.")
    steps: List[str] = Field(description="Langkah-langkah memasak berurutan.")

class MultiRecipeResponse(BaseModel):
    recipes: List[RecipeDetail] = Field(description="Tepat 3 rekomendasi resep dengan tingkat kesulitan berbeda.")


# ══════════════════════════════════════════════════
# HELPER: UPLOAD FILE KE GCS
# ══════════════════════════════════════════════════
def upload_to_gcs(file_bytes: bytes, mime_type: str, original_filename: str) -> str:
    bucket = storage_client.bucket(BUCKET_NAME)
    ext = original_filename.split(".")[-1] if "." in original_filename else "jpg"
    unique_filename = f"uploads/{uuid.uuid4()}.{ext}"
    blob = bucket.blob(unique_filename)
    blob.upload_from_string(file_bytes, content_type=mime_type)
    gcs_url = f"https://storage.googleapis.com/{BUCKET_NAME}/{unique_filename}"
    print(f"💾 File tersimpan di GCS: {gcs_url}")
    return gcs_url


# ══════════════════════════════════════════════════
# TAHAP 1: UPLOAD & DETEKSI BAHAN
# ══════════════════════════════════════════════════
@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        content = await file.read()
        mime_type = file.content_type

        gcs_url = upload_to_gcs(content, mime_type, file.filename)
        print(f"\n[STEP 1] Gambar disimpan ke GCS, mengirim ke Gemini Vision...")

        image_part = types.Part.from_bytes(
            data=content,
            mime_type=mime_type,
        )

        filter_prompt = """
        Analisis foto isi kulkas atau bahan makanan ini dengan sangat detail dan teliti.
        
        TUGAS ANDA:
        1. Identifikasi semua nama bahan makanan spesifik yang dapat Anda lihat. Jangan gunakan kata generalisasi umum seperti 'Sayuran' atau 'Buah'.
        2. Estimasi jumlah/takaran masing-masing bahan yang tampak jelas di foto.
        3. Terjemahkan semua nama bahan ke Bahasa Indonesia sehari-hari.
        4. Masukkan ke struktur JSON sesuai response_schema. Jangan biarkan list kosong jika gambar berisi makanan.
        """

        gemini_response = ai_client.models.generate_content(
            model=MODEL_NAME,
            contents=[image_part, filter_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DetectedIngredients,
                temperature=0.2,
            ),
        )

        clean_json = gemini_response.text.strip()
        print(f"💚 GEMINI VISION RESPONSE: {clean_json}")

        data_json = json.loads(clean_json)
        raw_ingredients = data_json.get("ingredients", [])

        return {"labels": raw_ingredients, "image_url": gcs_url}

    except Exception as e:
        print(f"❌ ERROR DI /UPLOAD: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal menganalisis gambar: {str(e)}")


# ══════════════════════════════════════════════════
# TAHAP 2: GENERATE 3 OPSI RESEP
# ══════════════════════════════════════════════════
@app.post("/ai-recipe")
async def generate_recipe(data: IngredientList):
    try:
        ingredients_str = ", ".join(data.items)
        print(f"\n[STEP 2] Meminta 3 opsi resep untuk bahan: {ingredients_str}...")

        prompt = f"""
        Anda adalah koki profesional yang mahir dalam membuat variasi masakan Nusantara maupun Internasional.
        Buatkan tepat 3 buah rekomendasi resep masakan yang berbeda, realistis, dan lezat berdasarkan bahan: {ingredients_str}.
        
        Ketiga resep wajib dibagi berdasarkan tingkat kesulitan:
        1. "Mudah" - proses kilat, langkah sedikit, alat minimal
        2. "Sedang" - waktu memasak standar, teknik tumis/rebus biasa
        3. "Sulit" - kompleks, bumbu halus, atau waktu masak lama
        
        INSTRUKSI BAHASA: Seluruh konten WAJIB Bahasa Indonesia. Tidak ada istilah bahasa Inggris.
        INSTRUKSI FORMAT: Kembalikan murni JSON sesuai response_schema MultiRecipeResponse.
        """

        response = ai_client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MultiRecipeResponse,
                temperature=0.75,
            )
        )
        clean_text = response.text.strip()
        print(f"💚 GEMINI 3 OPSI RESEP: {clean_text}")

        recipes_json = json.loads(clean_text)
        print("💚 SELESAI - 3 resep sukses dikirim!\n")
        return recipes_json

    except json.JSONDecodeError as json_err:
        print(f"❌ ERROR JSON: {str(json_err)}")
        raise HTTPException(status_code=500, detail="Gemini tidak mengembalikan JSON valid.")
    except Exception as e:
        print(f"❌ ERROR DI /AI-RECIPE: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal memproses Gemini AI: {str(e)}")


# ══════════════════════════════════════════════════
# SERVING FRONTEND
# ══════════════════════════════════════════════════
app.mount("/", StaticFiles(directory="smartchef-frontend", html=True), name="frontend")