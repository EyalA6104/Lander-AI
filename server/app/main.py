from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # ייבוא הכרחי

app = FastAPI()

# הגדרת ה"אישור" ל-React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # הכתובת של ה-Next.js/React שלך
    allow_credentials=True,
    allow_methods=["*"], # מאפשר את כל סוגי הבקשות (GET, POST וכו')
    allow_headers=["*"], # מאפשר את כל סוגי ה-Headers
)

@app.get("/")
def root():
    return {"message": "API is running"}
