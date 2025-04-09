from models import db
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin


class Mood(db.Model, SerializerMixin):
    __tablename__ = 'moods'
    id = db.Column(db.Integer, primary_key=True)
    emoji = db.Column(db.String(10), nullable=False)
    score = db.Column(db.Integer, nullable=False)  #! Numeric score for graph

    #! Relationship: Many-to-many between Mood and Entry
    entries = db.relationship("Entry", secondary="entry_moods", back_populates="moods")
    serialize_rules = ('-entries',)
    def to_dict(self):
        return {
            "id": self.id,
            "emoji": self.emoji,
            "score": self.score
        }
