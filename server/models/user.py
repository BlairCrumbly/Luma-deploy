import re
from models import db
from config import bcrypt
from sqlalchemy.orm import validates
from better_profanity import profanity
from sqlalchemy_serializer import SerializerMixin

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'
    
    # Fields
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String, unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)  #* nullable for google users
    google_id = db.Column(db.String, unique=True, nullable=True)
    google_token = db.Column(db.String, nullable=True)

    #! relationships
    journals = db.relationship("Journal", back_populates="user", cascade="all, delete-orphan")

    #! serialize
    serialize_rules = ('-password_hash', '-google_token', '-google_id', 'journals')

    #! validations
    @validates('email')
    def validate_email(self, key, email):
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_regex, email):
            raise ValueError("Invalid email format")
        return email

    @validates('username')
    def validate_username(self, key, username):
        #! remove unwanted characters (only letters, numbers, underscore, dot allowed)
        sanitized_username = re.sub(r"[^a-zA-Z0-9_.]", "", username)  # Keep the original case

        if not sanitized_username:
            raise ValueError("Username contains invalid characters")
        
        if profanity.contains_profanity(sanitized_username):
            raise ValueError("Username contains inappropriate content")
        
        return sanitized_username

    @validates('password_hash')
    def validate_password(self, key, password):
        # Allow None for users authenticated via Google
        if password is None:
            return None
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"\d", password):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise ValueError("Password must contain at least one special character")
        return password

    # Method to set password hash
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    # Method to check password hash
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    # Methods to manage Google OAuth token
    def set_google_token(self, token):
        self.google_token = token

    def revoke_google_token(self):
        self.google_token = None
