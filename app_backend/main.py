from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import re
from app_backend.database import SessionLocal, engine
from app_backend import models
from app_backend.models import User, UserPreference, LikedGame, WishlistGame
from app_backend.security import hash_password, verify_password
from app_backend.schemas import RegisterRequest, LoginRequest, PreferenceRequest
from sklearn.metrics.pairwise import cosine_similarity
import requests
from recommender.loader import get_recommender
from difflib import get_close_matches
import pandas as pd
from pydantic import BaseModel
import json



def normalize(text):
    text = text.lower()

    roman_map = {
        " i ": " 1 ",
        " ii ": " 2 ",
        " iii ": " 3 ",
        " iv ": " 4 ",
        " v ": " 5 ",
        " vi ": " 6 ",
        " vii ": " 7 ",
        " viii ": " 8 ",
        " ix ": " 9 ",
        " x ": " 10 ",
    }

    for r, n in roman_map.items():
        text = text.replace(r, n)

    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    return text

print("BACKEND RUNNING CLEAN")

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

df= pd.read_csv("data/steam_clean.csv")
df["Name"] = df["Name"].astype(str)
OLLAMA_MODEL = "llama3"

def ask_llm(prompt: str):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        return response.json()["response"]
    except Exception as e:
        return "LLM connection error."
    

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recommender = get_recommender()
recommender.df["normalized_name"] = recommender.df["Name"].apply(normalize)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):

    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}


@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "user_id": user.id,
        "name": user.name
    }


@app.get("/search-game")
def search_game(query: str):

    if len(query.strip()) < 2:
        return {"results": []}

    matches = recommender.df[
        recommender.df["Name"].str.contains(query, case=False, na=False)
    ]

    matches = matches.drop_duplicates(subset=["Name"]).head(8)

    return {
        "results": matches[["AppID", "Name"]].to_dict(orient="records")
    }


@app.post("/recommend")
def recommend(
    request: PreferenceRequest,
    page: int = 1,
    limit: int = 12,
    db: Session = Depends(get_db)
):

    app_ids = request.liked_app_ids

    all_results = recommender.recommend_from_app_ids(
        app_ids=app_ids,
        top_n=500,
        max_hours=request.max_hours,
        exploration_mode=request.exploration_mode
    )

    start = (page - 1) * limit
    end = start + limit

    return {
        "results": all_results[start:end],
        "has_more": end < len(all_results)
    }

from pydantic import BaseModel

class WishlistAddRequest(BaseModel):
    user_id: int
    app_id: int


@app.post("/wishlist/add")
def add_to_wishlist(request: WishlistAddRequest, db: Session = Depends(get_db)):

    if db.query(WishlistGame).filter(
        WishlistGame.user_id == request.user_id,
        WishlistGame.app_id == request.app_id
    ).first():
        return {"message": "Already in wishlist"}

    db.add(WishlistGame(user_id=request.user_id, app_id=request.app_id))
    db.commit()

    return {"message": "Added to wishlist"}


@app.get("/wishlist")
def get_wishlist(user_id: int, db: Session = Depends(get_db)):

    items = db.query(WishlistGame).filter(
        WishlistGame.user_id == user_id
    ).all()

    app_ids = [item.app_id for item in items]

    results = recommender.df[
        recommender.df["AppID"].isin(app_ids)
    ]

    formatted = []

    for _, row in results.iterrows():
        formatted.append({
            "AppID": int(row["AppID"]),
            "Name": row["Name"],
            "playtime_hours": round(row.get("playtime_hours", 0), 2),
            "steam_url": f"https://store.steampowered.com/app/{int(row['AppID'])}"
        })

    return {"results": formatted}

from pydantic import BaseModel

class WishlistRemoveRequest(BaseModel):
    user_id: int
    app_id: int


@app.post("/wishlist/remove")
def remove_from_wishlist(request: WishlistRemoveRequest, db: Session = Depends(get_db)):

    db.query(WishlistGame).filter(
        WishlistGame.user_id == request.user_id,
        WishlistGame.app_id == request.app_id
    ).delete()

    db.commit()

    return {"message": "Removed from wishlist"}

from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str


from difflib import get_close_matches
import re

from sklearn.metrics.pairwise import cosine_similarity

import requests

def ask_llm(prompt: str):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        },
        timeout=120
    )
    return response.json()["response"]



last_recommended_app_id = None
last_recommendations_given = set()


def ask_llm(prompt: str):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        },
        timeout=120
    )
    return response.json()["response"].strip()

class ChatRequest(BaseModel):
    message: str

def smart_match(title):
    words = re.split(r"\W+", title.lower())

    condition = df["Name"].str.lower().apply(
        lambda x: all(word in x for word in words if len(word) > 2)
    )

    return df[condition]

@app.post("/chat")
def chat(request: ChatRequest):

    user_message = request.message.strip()

    if not user_message:
        return {"games": []}

    prompt = f"""
    You are a video game recommendation engine.

    Understand abbreviations:
    - GTA 5 = Grand Theft Auto V
    - RDR2 = Red Dead Redemption 2

    User request:
    "{user_message}"

    Return ONLY a JSON array.
    Return 5 FULL standalone game titles.
    No DLC.
    No expansions.
    No remasters.

    Format strictly:
    [
      {{"name": "Game Title 1"}},
      {{"name": "Game Title 2"}},
      {{"name": "Game Title 3"}},
      {{"name": "Game Title 4"}},
      {{"name": "Game Title 5"}}
    ]
    """

    try:
        response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        raw_output = response.json()["response"].strip()

        start = raw_output.find("[")
        end = raw_output.rfind("]") + 1

        if start == -1 or end == -1:
            return {"games": []}

        recommended = json.loads(raw_output[start:end])

        matched_games = []

        for item in recommended:
            title = item["name"].strip()

            match = df[df["Name"].str.contains(title, case=False, na=False)]

            if not match.empty:
                row = match.iloc[0]
                app_id = int(row["AppID"])

                matched_games.append({
                    "appid": app_id,
                    "name": row["Name"],
                    "header_image": f"https://cdn.cloudflare.steamstatic.com/steam/apps/{app_id}/header.jpg",
                    "short_description": row["combined_text"][:200]  # use combined_text as summary
                })

        return {"games": matched_games}

    except Exception as e:
        print("CHAT ERROR:", e)
        return {"games": []}