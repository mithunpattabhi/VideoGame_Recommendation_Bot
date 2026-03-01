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

from recommender.loader import get_recommender
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

@app.post("/chat")
def chat(request: ChatRequest):

    message = request.message.strip()

    if not message:
        return {"response": "Hey 👋 What would you like to talk about?"}

    normalized_message = normalize(message)
    message_tokens = set(normalized_message.split())

    # -----------------------------------
    # STRICT GAME DETECTION
    # -----------------------------------

    best_match = None
    best_score = 0
    best_index = None

    for idx, row in recommender.df.iterrows():
        game_tokens = set(row["normalized_name"].split())
        overlap = len(message_tokens & game_tokens)

        if overlap > best_score:
            best_score = overlap
            best_match = row
            best_index = idx

    if best_score < 2:
        return {
            "response": "I couldn't clearly detect the game name. Try typing it more precisely."
        }

    game_name = best_match["Name"]
    app_id = int(best_match["AppID"])

    # -----------------------------------
    # STRICT SIMILARITY FOR CHAT ONLY
    # -----------------------------------

    similarity_scores = cosine_similarity(
        recommender.tfidf_matrix[best_index],
        recommender.tfidf_matrix
    ).flatten()

    recommender.df["chat_similarity"] = similarity_scores

    rec_df = recommender.df[
        recommender.df["AppID"] != app_id
    ]

    rec_df = rec_df[rec_df["chat_similarity"] > 0.15]

    rec_df = rec_df.sort_values(
        "chat_similarity",
        ascending=False
    ).head(5)

    if rec_df.empty:
        return {
            "response": f"I couldn't find strong similar games to {game_name}."
        }

    response_text = f"If you liked {game_name}, you might enjoy:\n\n"

    for _, row in rec_df.iterrows():
        response_text += f"• {row['Name']}\n"

    return {"response": response_text}
    