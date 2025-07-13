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

# Naming convention for migrations
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
metadata = MetaData(naming_convention=naming_convention)

# Flask app instance
app = Flask(
    __name__,
    static_url_path='',
    static_folder='../client/dist',
    template_folder='../client/dist'
)

app.config['PROPAGATE_EXCEPTIONS'] = True
IS_PRODUCTION = os.getenv("FLASK_ENV") == "production" or os.getenv("NODE_ENV") == "production"

# Core configuration
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT config
app.config.update({
    "JWT_SECRET_KEY": os.getenv("JWT_SECRET_KEY"),
    "JWT_TOKEN_LOCATION": ["cookies"],
    "JWT_ACCESS_TOKEN_EXPIRES": timedelta(hours=24),
    "JWT_REFRESH_TOKEN_EXPIRES": timedelta(days=30),

    # Cookie settings - adjust based on environment
    "JWT_COOKIE_SECURE": IS_PRODUCTION,  # Only require HTTPS in production
    "JWT_COOKIE_SAMESITE": "None" if IS_PRODUCTION else "Lax",
    "JWT_ACCESS_COOKIE_HTTPONLY": True,
    "JWT_REFRESH_COOKIE_HTTPONLY": True,

    # CSRF protection
    "JWT_COOKIE_CSRF_PROTECT": True,
    "JWT_CSRF_IN_COOKIES": True,
    "JWT_CSRF_METHODS": ["POST", "PUT", "PATCH", "DELETE"],

    # Allow JavaScript to read CSRF cookies
    "JWT_ACCESS_CSRF_COOKIE_HTTPONLY": False,
    "JWT_REFRESH_CSRF_COOKIE_HTTPONLY": False,

    # CSRF cookie names
    "JWT_ACCESS_CSRF_COOKIE_NAME": "csrf_access_token",
    "JWT_REFRESH_CSRF_COOKIE_NAME": "csrf_refresh_token",
})


# Flask-Session (used for OAuth)
app.config.update({
    "SESSION_TYPE": "filesystem",
    "SESSION_COOKIE_NAME": "oauth_session",
    "SESSION_COOKIE_SAMESITE": "None" if IS_PRODUCTION else "Lax",
    "SESSION_COOKIE_HTTPONLY": True,
    "SESSION_COOKIE_SECURE": IS_PRODUCTION,
    "PERMANENT_SESSION_LIFETIME": timedelta(minutes=5),
})

# Initialize extensions
sess = Session(app)
db = SQLAlchemy(app=app, metadata=metadata)
migrate = Migrate(app=app, db=db)
bcrypt = Bcrypt(app=app)
jwt = JWTManager(app)
api = Api(app)

# Update CORS configuration for production
frontend_urls = [
    "https://luma-deploy-frontend.onrender.com",
    os.getenv("FRONTEND_URL", "https://luma-deploy-frontend.onrender.com"),
]

# Add localhost for development
if not IS_PRODUCTION:
    frontend_urls.extend([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ])

CORS(
    app,
    supports_credentials=True,
    origins=frontend_urls,
    allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN"],
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
)

# Google OAuth setup
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    redirect_uri=os.getenv("PROD_REDIRECT_URI"),
    client_kwargs={"scope": "openid email profile"}
)

jwt = JWTManager(app)


# Error handlers
@app.errorhandler(500)
def internal_error(e):
    return jsonify(error="Internal Server Error", message=str(e)), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Not Found"), 404
