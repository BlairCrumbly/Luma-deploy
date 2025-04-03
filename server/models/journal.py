
from models import db
from datetime import datetime
from sqlalchemy.orm import validates
from sqlalchemy_serializer import SerializerMixin

class Journal(db.Model,SerializerMixin):
    __tablename__ = 'journals'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(30), unique=True, nullable=False)
    year = db.Column(db.Integer, unique=False, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    color = db.Column(db.String(7), nullable=False, default="#E7E5E5") #! store hex color code

    #! Relationships
    user = db.relationship("User", back_populates="journals")
    entries = db.relationship("Entry", back_populates="journal", cascade="all, delete-orphan")
    
    #! Serializer
    serialize_rules = ('-user', 'entries')

    #! Validations 
    @validates("title")
    def validate_title(self, key, value):
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
    

    @validates("color")
    def validate_color(self, key, value):
        #* R,O,Y,G,B,P,PI,BL,W
        allowed_colors = ["#EA3232", "#F19748","#EAD04B", "#55A973", "#2D8FB6", "#6A54B4","#FF8E9F","#151414","#E7E5E5"]
        if value not in allowed_colors:
            raise ValueError(f"Invalid color. Please choose from: {', '.join(allowed_colors)}")
        return value
