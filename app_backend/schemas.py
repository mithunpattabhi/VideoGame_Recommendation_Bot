from pydantic import BaseModel
from typing import List


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class PreferenceRequest(BaseModel):
    user_id: int
    max_hours: float
    exploration_mode: str
    liked_app_ids: List[int]


class WishlistRequest(BaseModel):
    app_id: int

class ChatRequest(BaseModel):
    message: str