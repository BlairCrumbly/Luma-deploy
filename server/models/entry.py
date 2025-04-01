from models import db
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates
from sqlalchemy.orm import SerializerMixin

class Entry(db.Model, SerializerMixin):
    __tablename__ = 'entries'
    id = db.Column(db.integer, primary_key=True)
    title = db.Column(db.String, unique=True, nullable=False, )
    main_text = db.Column(db.String, unique=True, nullable=False)
    created_at = db.Column(db.datetime)
    updated_at = db.Column(db.datetime)
    journal_id = db.Column(db.Integer, db.ForeignKey('journals.id'), nullable=False)
    ai_prompt_used = db.Column(db.Boolean)

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