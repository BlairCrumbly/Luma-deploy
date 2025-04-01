import re
from models import db
from config import bcrypt
from sqlalchemy.orm import validates
from better_profanity import profanity
from sqlalchemy_serializer import SerializerMixin

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    #! Relationships
    journals = db.relationship("Journal", back_populates="user", cascade="all, delete-orphan")

    #! Serializer
    serialize_rules = ('-password_hash', 'journals')

    #! Validations
    @validates('email')
    def validate_email(self, key, email):
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_regex, email):
            raise ValueError("Invalid email format")
        return email
    
    @validates('username')
    def validate_username(self, key, username):
        username_lower = username.lower()

        
        if profanity.contains_profanity(username_lower):
            raise ValueError("Username contains inappropriate content")
        
        
        if not re.match(r"^[a-zA-Z0-9_.]+$", username):
            raise ValueError("Username contains invalid characters")
        
        return username
    
    @validates('password')
    def validate_password(self, key, password):
        
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
