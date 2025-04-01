from models import db

class EntryMood(db.Model):
    __tablename__ = "entry_moods"
    __table_args__ = (db.UniqueConstraint("entry_id", "mood_id", name="unique_entry_mood"),)
    id = db.Column(db.Integer, primary_key=True)
    entry_id = db.Column(db.Integer, db.ForeignKey("entries.id"), nullable=False)
    mood_id = db.Column(db.Integer, db.ForeignKey("moods.id"), nullable=False)

