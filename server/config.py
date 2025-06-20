from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_restful import Api
from flask_cors import CORS
from dotenv import load_dotenv
from authlib.integrations.flask_client import OAuth
from flask_jwt_extended import JWTManager
from flask_session import Session
from datetime import timedelta
import os

load_dotenv()

# Naming conventions for Alembic migrations
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=naming_convention)

# Determine environment
IS_PRODUCTION = os.getenv("FLASK_ENV") == "production" or bool(os.getenv("RENDER"))

# Initialize Flask app
app = Flask(
    __name__,
    static_url_path='',
    static_folder='../client/dist',
    template_folder='../client/dist'
)

# Core config
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT configuration
app.config.update({
    "JWT_SECRET_KEY": os.getenv("JWT_SECRET_KEY"),
    "JWT_TOKEN_LOCATION": ["cookies"],
    "JWT_ACCESS_TOKEN_EXPIRES": timedelta(hours=24),
    "JWT_COOKIE_NAME": "access_token_cookie",
    "JWT_REFRESH_COOKIE_NAME": "refresh_token_cookie",
    "JWT_COOKIE_SECURE": IS_PRODUCTION,
    "JWT_COOKIE_SAMESITE": "None" if IS_PRODUCTION else "Lax",
    "JWT_COOKIE_HTTPONLY": True,
    "JWT_COOKIE_CSRF_PROTECT": True,
    "JWT_CSRF_IN_COOKIES": True,
    "JWT_CSRF_METHODS": ["POST", "PUT", "PATCH", "DELETE"],
})

# Session config
app.config.update({
    "SESSION_TYPE": "filesystem",
    "SESSION_PERMANENT": True,
    "SESSION_USE_SIGNER": True,
    "SESSION_COOKIE_SECURE": IS_PRODUCTION,
    "SESSION_COOKIE_HTTPONLY": True,
    "SESSION_COOKIE_SAMESITE": "Lax",
    "SESSION_FILE_THRESHOLD": 100,
    "SESSION_COOKIE_DOMAIN": None,
    "PERMANENT_SESSION_LIFETIME": timedelta(minutes=30),
})

# AI config
app.config["WRITECREAM_API_URL"] = os.getenv("WRITECREAM_API_URL")
app.config["WRITECREAM_API_KEY"] = os.getenv("WRITECREAM_API_KEY")
app.config["WRITECREAM_TOOL_ID"] = os.getenv("WRITECREAM_TOOL_ID")

# Initialize extensions
sess = Session(app)
db = SQLAlchemy(app=app, metadata=metadata)
migrate = Migrate(app=app, db=db)
bcrypt = Bcrypt(app=app)
jwt = JWTManager(app)
api = Api(app)

# CORS setup
CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",  # Vite dev
        "http://localhost:3000",  # Fallback
        "https://luma-deploy-frontend.onrender.com",
        os.getenv("FRONTEND_URL", "https://luma-deploy-frontend.onrender.com"),
    ],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
)

# OAuth setup (Google)
oauth = OAuth(app)

google = oauth.register(
    name='google',
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    redirect_uri=os.getenv("PROD_REDIRECT_URI") if IS_PRODUCTION else os.getenv("DEV_REDIRECT_URI"),
    client_kwargs={"scope": "openid email profile"}
)

# Return all errors as JSON to prevent <html> parsing issues in React
@app.errorhandler(500)
def internal_error(e):
    return jsonify(error="Internal Server Error", message=str(e)), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Not Found"), 404
