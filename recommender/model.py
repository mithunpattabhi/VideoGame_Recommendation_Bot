import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class GameRecommender:

    def __init__(self, data_path):
        self.df = pd.read_csv(data_path, encoding="utf-8")
        self._prepare()
        self._vectorize()
        print("loading file",data_path)

    def _prepare(self):
        self.df["Name"] = (
        self.df["Name"]
        .fillna("")
        .astype(str)
        
)

        dlc_keywords = [
            "dlc",
            "soundtrack",
            "pack",
            "resource",
            "booster",
            "expansion",
            "skin",
            "costume",
            "wallpaper",
            "digital book",
            "artbook",
            "bonus",
            "season pass",
            "upgrade",
            "add-on"
        ]

        pattern = "|".join(dlc_keywords)

        self.df = self.df[
            ~self.df["Name"].str.lower().str.contains(pattern, na=False)
        ]

        self.df = self.df[
            self.df["playtime_hours"] > 1
        ]

        self.df = (
            self.df.sort_values("playtime_hours", ascending=False)
            .drop_duplicates(subset=["Name"])
        )
        self.df["combined_text"] = (
            self.df["combined_text"]
            .fillna("")
            .astype(str)
            .str.lower()
        )

        self.df = self.df[self.df["combined_text"].str.strip() != ""]
        self.df = self.df.reset_index(drop=True)

    def _vectorize(self):

        self.vectorizer = TfidfVectorizer(
            max_features=50000,
            stop_words="english",
            ngram_range=(1, 2),   
            min_df=3              
        )

        self.tfidf_matrix = self.vectorizer.fit_transform(
            self.df["combined_text"]
        )


    def recommend_from_app_ids(
        self,
        app_ids,
        top_n=50,
        max_hours=None,
        exploration_mode="similar"
    ):

        indices = self.df[
            self.df["AppID"].isin(app_ids)
        ].index.tolist()

        if not indices:
            return []

        liked_vectors = self.tfidf_matrix[indices]

        similarity_matrix = cosine_similarity(
            liked_vectors,
            self.tfidf_matrix
        )

        similarity_scores = similarity_matrix.max(axis=0)

        df_scores = self.df.copy()
        df_scores["similarity"] = similarity_scores

        df_scores = df_scores[
            ~df_scores["AppID"].isin(app_ids)
        ]

        if max_hours:
            df_scores = df_scores[
                df_scores["playtime_hours"] <= max_hours
            ]

        df_scores = df_scores.sort_values(
            "similarity",
            ascending=False
        )

        if exploration_mode == "similar":
            results_df = df_scores.head(top_n)

        else:
            top_part = df_scores.head(int(top_n * 0.6))

            remaining = df_scores.iloc[int(len(df_scores) * 0.3):]

            diverse_part = remaining.sample(
                n=min(top_n - len(top_part), len(remaining)),
                replace=False
            )

            results_df = pd.concat([top_part, diverse_part])

        return self._format(results_df.head(top_n))

    def _format(self, df):

        results = []

        for _, row in df.iterrows():

            results.append({
                "AppID": int(row["AppID"]),
                "Name": row["Name"],
                "Release date": row.get("Release date", ""),
                "playtime_hours": round(row.get("playtime_hours", 0), 2),
                "reason": "Recommended based on gameplay similarity.",
                "steam_url": f"https://store.steampowered.com/app/{int(row['AppID'])}"
            })

        return results