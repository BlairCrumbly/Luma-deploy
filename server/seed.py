from config import app, db
from models import Mood




MOODS = [
    {"emoji": "😊", "score": 5},  # Happy
    {"emoji": "😃", "score": 5},  # Very Happy
    {"emoji": "🥰", "score": 5},  # Loving
    {"emoji": "🤩", "score": 5},  # Excited
    {"emoji": "😌", "score": 4},  # Content
    {"emoji": "🙂", "score": 4},  # Pleased
    {"emoji": "😐", "score": 3},  # Neutral
    {"emoji": "😕", "score": 2},  # Confused
    {"emoji": "😔", "score": 2},  # Sad
    {"emoji": "😢", "score": 1},  # Very Sad
    {"emoji": "😡", "score": 1},  # Angry
    {"emoji": "😨", "score": 1},  # Anxious
    {"emoji": "😴", "score": 3},  # Tired
    {"emoji": "🤔", "score": 3},  # Thoughtful
    {"emoji": "🤗", "score": 4},  # Grateful
]

def seed_moods_if_empty():
    if Mood.query.first() is None:
        print("Seeding moods...")
        for mood_data in MOODS:
            mood = Mood(emoji=mood_data["emoji"], score=mood_data["score"])
            db.session.add(mood)
        db.session.commit()
        print("Moods seeded successfully!")
    else:
        print("Moods already seeded. Skipping.")

if __name__ == "__main__":
    with app.app_context():
        seed_moods_if_empty()