from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Mengizinkan frontend (index.html) mengakses backend ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Struktur data untuk menerima daftar bahan dari frontend
class IngredientList(BaseModel):
    items: list[str]

@app.get("/")
def read_root():
    return {"message": "Backend Smart Chef Tiruan Berhasil Berjalan!"}

# 1. Endpoint tiruan untuk deteksi gambar
@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # Ini data buatan (mock data), pura-puranya hasil deteksi Google Vision
    return {
        "labels": ["Telur", "Tomat", "Bawang Merah", "Bawang Putih", "Cabai"]
    }

# 2. Endpoint tiruan untuk rekomendasi resep
@app.post("/ai-recipe")
async def generate_recipe(data: IngredientList):
    # Ini data buatan, pura-puranya hasil generate dari Gemini AI
    return {
        "recipe": {
            "title": "Telur Dadar Tomat Spesial AI",
            "ingredients": [
                "2 butir Telur (dikocok lepas)",
                "1 buah Tomat (potong dadu)",
                "Bawang Merah & Bawang Putih (cincang halus)",
                "Cabai secukupnya (opsional)"
            ],
            "steps": [
                "Tumis bawang merah, bawang putih, dan cabai hingga harum.",
                "Masukkan potongan tomat, masak hingga sedikit layu.",
                "Tuangkan telur kocok, lalu ratakan ke seluruh wajan.",
                "Goreng dengan api sedang hingga matang merata di kedua sisi.",
                "Telur dadar tomat spesial siap disajikan hangat!"
            ]
        }
    }