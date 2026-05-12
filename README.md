# AI-Powered Video Game Recommendation System

A full-stack machine learning project that recommends video games based on gameplay similarity using content-based filtering techniques. The system analyzes game metadata such as genres, tags, categories, developers, and descriptions to generate personalized recommendations.

This project was built to explore how recommendation systems work in real-world applications using a large-scale dataset of Steam games.

---

# Features

- Content-based game recommendation system
- TF-IDF vectorization for feature extraction
- Cosine similarity for recommendation generation
- User authentication using JWT
- Wishlist management
- AI-assisted chat interaction
- FastAPI backend with REST APIs
- React + Vite frontend

---

# Tech Stack

## Frontend
- React (Vite)
- Tailwind CSS
- Framer Motion

## Backend
- FastAPI
- SQLAlchemy
- JWT Authentication

## Machine Learning
- Scikit-learn
- TF-IDF Vectorizer
- Cosine Similarity

## Database
- SQLite

---

# Dataset

The project uses a Steam games dataset containing over **120,000+ games**.

The dataset includes:

- Game names
- Genres
- Tags
- Categories
- Developers
- Publishers
- Game descriptions
- Playtime information

Due to GitHub file size limitations, the dataset is not included in this repository.

---

# Project Structure

```bash
Game_Recommendation_Bot/
│
├── app_backend/        # FastAPI backend
├── frontend/           # React frontend
├── recommender/        # Recommendation engine
├── data/               # Dataset folder
├── requirements.txt
└── README.md

```
---

# How the Recommendation System Works

1. Game metadata such as genres, tags, and descriptions are combined into a single text feature.

2. TF-IDF Vectorization converts the text into numerical vectors.

3. Cosine similarity is used to measure similarity between games.

4. Based on the selected games, the system recommends similar titles.

---

# Running the Project Locally

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/Game_Recommendation_Bot.git
cd Game_Recommendation_Bot
```

---

## 2. Install Backend Requirements

```bash
pip install -r requirements.txt
```

---

## 3. Add Dataset

Create a folder named:

```bash
data
```

Place the dataset file inside:

```bash
data/steam_clean.csv
```

---

## 4. Run Backend Server

```bash
python -m uvicorn app_backend.main:app --reload
```

Backend runs on:

```bash
http://127.0.0.1:8000
```

API Documentation:

```bash
http://127.0.0.1:8000/docs
```

---

## 5. Run Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# Challenges Faced

- Handling large-scale game metadata efficiently
- Maintaining consistency between preprocessing and vectorization
- Managing recommendation quality for highly similar genres
- Optimizing recommendation speed for large datasets

---

# Future Improvements

- Hybrid recommendation system
- Collaborative filtering
- Advanced ranking algorithms
- Cloud deployment support
- Real-time recommendation updates

---

# Author

Mithun Pattabhi
