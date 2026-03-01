from .model import GameRecommender

_recommender_instance = None


def get_recommender():
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = GameRecommender(
            data_path="data/steam_clean.csv"
        )
    return _recommender_instance