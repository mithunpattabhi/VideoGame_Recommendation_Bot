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
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

last_recommended_titles = []
last_original_request = ""
all_recommended_games = set()


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

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        },
        timeout=60
    )

    data = response.json()

    if "choices" not in data:
        return "LLM error"

    return data["choices"][0]["message"]["content"]
    

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
    
    global last_recommended_titles, last_original_request, all_recommended_games
    
    recommendation_keywords = [
        "recommend", "game", "fps", "action", "adventure", "rpg", "strategy",
        "shooter", "racing", "puzzle", "sports", "indie", "horror", "fantasy",
        "sci-fi", "sci fi", "simulation", "moba", "mmorpg", "like", "similar",
        "more", "another", "suggest", "what", "which", "best", "top", "give me",
        "show me", "find", "search", "looking for", "want", "need", "enjoy",
        "prefer", "genre", "type of game", "keep it coming", "comin"
    ]
    
    user_message_lower = user_message.lower()
    
    has_recommendation_keyword = any(keyword in user_message_lower for keyword in recommendation_keywords)
    
    is_continuation = (
        any(word in user_message_lower for word in ["more", "another", "similar", "like that", "again", "keep", "comin"]) 
        and len(last_recommended_titles) > 0
    )
    
    is_recommendation_request = has_recommendation_keyword or is_continuation
    
    if not is_recommendation_request:
        intent_prompt = f"""
        Is the user asking for game recommendations or discussing games?
        User message: "{user_message}"
        
        Answer with only "YES" or "NO".
        YES if they want game recommendations, game suggestions, or talk about gaming preferences.
        NO if they're just greeting, thanking, making small talk, or asking something unrelated to games.
        """
        intent = ask_llm(intent_prompt).strip().upper()
        is_recommendation_request = "YES" in intent
    
    if not is_recommendation_request:
        friendly_prompt = f"""
        The user sent: "{user_message}"
        
        Respond in a friendly and helpful way. Remind them that you're here to recommend games.
        Ask them what type of games they like or what game they want recommendations similar to.
        Keep the response brief (1-2 sentences).
        """
        response_text = ask_llm(friendly_prompt)
        return {"text": response_text}
    
    actual_request = user_message
    
    if is_continuation and last_original_request:
        actual_request = last_original_request
        print(f"Using original request context: {actual_request}")
    else:
        last_original_request = user_message
        all_recommended_games = set()
        print(f"New request saved: {actual_request}")
    
    context_parts = []
    
    if len(last_recommended_titles) > 0:
        context_parts.append(f"Previous recommendations were: {', '.join(last_recommended_titles)}")
    
    if len(all_recommended_games) > 0:
        games_to_avoid = ", ".join(list(all_recommended_games)[:20])
        context_parts.append(f"Games already recommended (MUST NOT recommend these again): {games_to_avoid}")
    
    context = " ".join(context_parts)
    
    recommendation_prompt = f"""
    You are a video game recommendation engine.

    Understand abbreviations:
    - GTA 5 = Grand Theft Auto V
    - RDR2 = Red Dead Redemption 2
    
    {context}
    
    User request:
    "{actual_request}"

    Return ONLY a JSON array with EXACTLY 5 games.
    Return 5 FULL standalone game titles that actually exist.
    No DLC.
    No expansions.
    No remasters.
    Each game must be a real, full game title.
    NEVER recommend games from the "Games already recommended" list above.

    If the user is asking for more recommendations, suggest DIFFERENT games but STRICTLY same genre/type as the original request.

    Format strictly:
    [
      {{"name": "Game Title 1"}},
      {{"name": "Game Title 2"}},
      {{"name": "Game Title 3"}},
      {{"name": "Game Title 4"}},
      {{"name": "Game Title 5"}}
    ]
    """
    
    def get_steam_details(app_id):
        try:
            url = f"https://store.steampowered.com/api/appdetails?appids={app_id}"
            response = requests.get(url, timeout=10)
            data = response.json()

            if data[str(app_id)]["success"]:
                game_data = data[str(app_id)]["data"]

                return {
                    "short_description": game_data.get("short_description", "")
                }

        except Exception as e:
            print("Steam API error:", e)

        return {
            "short_description": ""
        }
    
    def find_game_in_df(title):
        """Find a game in the dataframe with fuzzy matching"""
        title = title.strip()
        
        match = df[df["Name"].str.contains(title, case=False, na=False)]
        if not match.empty:
            return match.iloc[0]
        
        all_game_names = df["Name"].tolist()
        close_matches = get_close_matches(title, all_game_names, n=1, cutoff=0.6)
        
        if close_matches:
            best_match = close_matches[0]
            match = df[df["Name"] == best_match]
            if not match.empty:
                return match.iloc[0]
        
        return None
    
    try:
        raw_output = ask_llm(recommendation_prompt)
        print(f"LLM Raw Output: {raw_output}")

        start = raw_output.find("[")
        end = raw_output.rfind("]") + 1

        if start == -1 or end == -1:
            print("No JSON array found in LLM output")
            return {"games": []}

        recommended = json.loads(raw_output[start:end])
        print(f"Parsed {len(recommended)} games from LLM")
        
        last_recommended_titles = [item["name"] for item in recommended]

        matched_games = []
        
        for item in recommended:
            title = item["name"].strip()
            print(f"Searching for: {title}")
            
            game_row = find_game_in_df(title)
            
            if game_row is not None:
                app_id = int(game_row["AppID"])
                steam_info = get_steam_details(app_id)
                matched_games.append({
                    "appid": app_id,
                    "name": game_row["Name"],
                    "header_image": f"https://cdn.cloudflare.steamstatic.com/steam/apps/{app_id}/header.jpg",
                    "short_description": steam_info["short_description"]
                })
                all_recommended_games.add(game_row["Name"])
                print(f"✓ Found match: {game_row['Name']}")
            else:
                print(f"✗ No match found for: {title}")

        print(f"Returning {len(matched_games)} games")
        print(f"Total games recommended so far: {all_recommended_games}")
        return {"games": matched_games}

    except Exception as e:
        print("CHAT ERROR:", e)
        import traceback
        traceback.print_exc()
        return {"games": []}