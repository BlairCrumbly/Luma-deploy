import re
from models import db
from config import bcrypt
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates
from better_profanity import profanity

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    @validates('email')
    def validate_email(self, key, email):
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_regex, email):
            raise ValueError("invalid email format")
        return email
    
    @validates('password')
    def validate_password(self, key, password_hash):
        if len(password_hash) < 8 :
            raise ValueError ("Password must be at least 8 charaters long.")
        
        if not re.search(r"\d", password_hash):
            raise ValueError("Password must contain at least one number")
        
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password_hash):
            raise ValueError("Password must contain at least one special character")

    @validates('username')
    def validate_username(self,key,username):
        username_lower = username.lower()
        
        #! checks for offensive words and profanity
        if profanity.contains_profanity(username_lower):
            raise ValueError("Username contains inappropriate content")
        
        #! makes sure username only has valid characters (upper and lowercase letters, nums, _ and .)
        if not re.match(r"^[a-zA-Z0-9_.]+$", username):
            raise ValueError("Username contains invalid characters")

