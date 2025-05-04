from models import db
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy import DateTime

class Entry(db.Model, SerializerMixin):
    __tablename__ = 'entries'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, unique=False, nullable=False, )
    main_text = db.Column(db.String, unique=False, nullable=True)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)
    journal_id = db.Column(db.Integer, db.ForeignKey('journals.id'), nullable=False)
    ai_prompt_used = db.Column(db.Boolean)
    #! Relationships
    journal = db.relationship("Journal", back_populates="entries")
    moods = db.relationship("Mood", secondary="entry_moods", back_populates="entries", cascade="save-update, merge")
    #!Serializer
    serialize_rules = ('-journal', 'moods')
    #! Validations
    #! make sure title isnt empty
    @validates("title")
    def validate_title(self, key, value):
        if not value or len(value.strip()) == 0:
            raise ValueError("Title cannot be empty.")
        return value.strip()
    
    #! user must choose either freewrite or ai prompt
    @validates("ai_prompt_used")
    def validate_ai_prompt_used(self, key, value):
        if value is None:
            raise ValueError("You must choose either AI-Prompt or Freewrite.")
        return value