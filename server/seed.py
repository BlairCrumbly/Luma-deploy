from config import db, app
from models import Mood

MOODS = [
    {"emoji": "😊", "score": 5},
    {"emoji": "😃", "score": 5},
    {"emoji": "🥰", "score": 5},
    {"emoji": "🤩", "score": 5},
    {"emoji": "😌", "score": 4},
    {"emoji": "🙂", "score": 4},
    {"emoji": "😐", "score": 3},
    {"emoji": "😕", "score": 2},
    {"emoji": "😔", "score": 2},
    {"emoji": "😢", "score": 1},
    {"emoji": "😡", "score": 1},
    {"emoji": "😨", "score": 1},
    {"emoji": "😴", "score": 3},
    {"emoji": "🤔", "score": 3},
    {"emoji": "🤗", "score": 4},
]

def seed_moods_if_empty():
    if Mood.query.first():
        print("Moods already seeded.")
        return

    print("Seeding moods...")
    for mood_data in MOODS:
        mood = Mood(emoji=mood_data["emoji"], score=mood_data["score"])
        db.session.add(mood)
    db.session.commit()
    print("Moods seeded successfully.")
