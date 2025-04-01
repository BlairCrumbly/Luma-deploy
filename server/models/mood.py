from models import db
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates
from sqlalchemy.orm import SerializerMixin

class Mood(db.Model, SerializerMixin):
    __tablename__ = 'moods'
    id = db.Column(db.Integer, primary_key=True)
    entry_id = db.Column(db.integer, db.ForeignKey('entries.id'))