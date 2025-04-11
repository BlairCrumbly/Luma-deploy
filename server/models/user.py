import re
from models import db
from config import bcrypt
from sqlalchemy.orm import validates
from better_profanity import profanity
from sqlalchemy_serializer import SerializerMixin
import time
import requests
import os

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String, unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)  #* nullable for google users
    google_id = db.Column(db.String, unique=True, nullable=True)
    google_token = db.Column(db.String, nullable=True)
    google_refresh_token = db.Column(db.String, nullable=True)  # Added for refresh token
    token_expiry = db.Column(db.Integer, nullable=True)  # Unix timestamp for token expiry

    #! relationships
    journals = db.relationship("Journal", back_populates="user", cascade="all, delete-orphan")

    #! serialize
    serialize_rules = ('-password_hash', '-google_token', '-google_id', '-google_refresh_token', '-token_expiry', 'journals')

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
        #! Allow None for users authenticated via Google
        if password is None:
            return None
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"\d", password):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise ValueError("Password must contain at least one special character")
        return password


    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')


    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def set_google_token(self, token):
        self.google_token = token

    def revoke_google_token(self):
        self.google_token = None
        self.google_refresh_token = None
        self.token_expiry = None

    #! refresh token functionality
    def set_google_refresh_token(self, refresh_token):
        self.google_refresh_token = refresh_token
    
    def set_token_expiry(self, expiry_timestamp):
        self.token_expiry = expiry_timestamp
    
    def is_token_expired(self):
        """Check if the Google token is expired or about to expire"""
        if not self.token_expiry:
            return True
        

        return int(time.time()) >= (self.token_expiry - 300)
    
    def refresh_google_token(self):
        """Refresh the Google access token using the refresh token"""
        if not self.google_refresh_token:
            return False
            
        token_url = "https://oauth2.googleapis.com/token"
        refresh_data = {
            "client_id": os.getenv("CLIENT_ID"),
            "client_secret": os.getenv("CLIENT_SECRET"),
            "refresh_token": self.google_refresh_token,
            "grant_type": "refresh_token"
        }
        
        try:
            token_response = requests.post(token_url, data=refresh_data)
            if token_response.status_code != 200:
                print(f"Refresh token error: {token_response.text}")
                return False
                
            token_json = token_response.json()
            self.set_google_token(token_json.get("access_token"))
            self.set_token_expiry(int(time.time()) + int(token_json.get("expires_in", 3600)))
            

            if "refresh_token" in token_json:
                self.set_google_refresh_token(token_json.get("refresh_token"))
                
            db.session.commit()
            return True
        except Exception as e:
            print(f"Error refreshing Google token: {str(e)}")
            return False