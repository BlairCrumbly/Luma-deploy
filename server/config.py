from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_restful import Api
from flask_cors import CORS
from dotenv import load_dotenv
from authlib.integrations.flask_client import OAuth

import os
from datetime import timedelta
from flask_jwt_extended import JWTManager
from flask_session import Session

load_dotenv()

naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=naming_convention)

app = Flask(
    __name__,
    static_url_path='',
    static_folder='../client/dist',
    template_folder='../client/dist'
)

# Determine if we're in production
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production' or os.getenv('RENDER')

app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT Configuration - adjusted for Render deployment
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_SECRET_KEY"] = os.getenv('JWT_SECRET_KEY')
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

app.config["JWT_COOKIE_NAME"] = "access_token_cookie"
app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token_cookie"
# Cookie security settings based on environment
app.config["JWT_COOKIE_SECURE"] = IS_PRODUCTION  # Only secure in production
app.config["JWT_COOKIE_SAMESITE"] = "Lax" if IS_PRODUCTION else "Lax"  # Changed from None for better compatibility
app.config["JWT_COOKIE_HTTPONLY"] = True
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_CSRF_IN_COOKIES"] = True
app.config["JWT_CSRF_METHODS"] = ["POST", "PUT", "PATCH", "DELETE"]

# Session config
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = True  
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_COOKIE_SECURE"] = IS_PRODUCTION
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=30)
app.config["SESSION_FILE_THRESHOLD"] = 100
app.config["SESSION_COOKIE_DOMAIN"] = None

# AI config
app.config["WRITECREAM_API_URL"] = os.getenv("WRITECREAM_API_URL")
app.config["WRITECREAM_API_KEY"] = os.getenv("WRITECREAM_API_KEY")
app.config["WRITECREAM_TOOL_ID"] = os.getenv("WRITECREAM_TOOL_ID")

sess = Session(app)
db = SQLAlchemy(app=app, metadata=metadata)
jwt = JWTManager(app)
migrate = Migrate(app=app, db=db)
bcrypt = Bcrypt(app=app)
api = Api(app=app)

# CORS configuration - adjusted for production
if IS_PRODUCTION:
    CORS(app,
         supports_credentials=True,
         origins=[
             "https://luma-deploy-frontend.onrender.com",
             os.getenv("FRONTEND_URL", "https://luma-deploy-frontend.onrender.com")
         ],
         allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    )
else:
    CORS(app,
         supports_credentials=True,
         origins=["http://localhost:5173", "http://localhost:3000"],
         allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    )

oauth = OAuth(app)

google = oauth.register(
    name='google',
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    redirect_uri=os.getenv("PROD_REDIRECT_URI") if IS_PRODUCTION else os.getenv("DEV_REDIRECT_URI"),
    client_kwargs={"scope": "openid email profile"}
)