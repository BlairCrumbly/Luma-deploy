
from models import db
from datetime import datetime
from sqlalchemy.orm import validates
from sqlalchemy.orm import SerializerMixin

class Journal(db.Model,SerializerMixin):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(30), unique=True, nullable=False)
    year = db.Column(db.Integer, unique=False, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    color = db.Column(db.String(7), nullable=False, default="#ffffff") #! store hex color code

    @validates("name")
    def validate_name(self, key, value):
        if not value or len(value.strip()) == 0:
            raise ValueError("Journal title cannot be empty.")
        if len(value) > 30:
            raise ValueError("Journal title should not exceed 30 characters.")
        return value.strip()

    @validates("year")
    def validate_year(self, key, value):
        current_year = datetime.now().year
        if value < 1900 or value > current_year:
            raise ValueError("Year must be between 1900 and the current year.")
        return value