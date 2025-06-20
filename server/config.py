from flask import Flask
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

import os
from datetime import timedelta

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

# Basic app config
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT config
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

app.config["JWT_COOKIE_NAME"] = "access_token_cookie"
app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token_cookie"  # If you use refresh tokens
app.config["JWT_COOKIE_SAMESITE"] = "None"  # Allow cross-site cookies
app.config["JWT_COOKIE_HTTPONLY"] = True  # Prevent JS access to cookies
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_CSRF_IN_COOKIES"] = True
app.config["JWT_CSRF_METHODS"] = ["POST", "PUT", "PATCH", "DELETE"]

# Enable secure cookies only in production (requires HTTPS)
if os.getenv("FLASK_ENV") == "production":
    app.config["JWT_COOKIE_SECURE"] = True
else:
    app.config["JWT_COOKIE_SECURE"] = False

# Session config
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_COOKIE_SECURE"] = app.config["JWT_COOKIE_SECURE"]
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=30)
app.config["SESSION_FILE_THRESHOLD"] = 100
app.config["SESSION_COOKIE_DOMAIN"] = None  # Set if needed

# AI config (example)
app.config["WRITECREAM_API_URL"] = os.getenv("WRITECREAM_API_URL")
app.config["WRITECREAM_API_KEY"] = os.getenv("WRITECREAM_API_KEY")
app.config["WRITECREAM_TOOL_ID"] = os.getenv("WRITECREAM_TOOL_ID")

sess = Session(app)
db = SQLAlchemy(app=app, metadata=metadata)
jwt = JWTManager(app)
migrate = Migrate(app=app, db=db)
bcrypt = Bcrypt(app=app)
api = Api(app=app)

# Allowed origins for CORS (add localhost dev + prod frontend)
allowed_origins = [
    "http://localhost:5173",
    "https://luma-deploy-frontend.onrender.com"
]

# Optionally append from env variable FRONTEND_URL
prod_frontend = os.getenv("FRONTEND_URL")
if prod_frontend and prod_frontend not in allowed_origins:
    allowed_origins.append(prod_frontend)

CORS(app,
     supports_credentials=True,
     origins=allowed_origins,
     allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

oauth = OAuth(app)

google = oauth.register(
    name='google',
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    redirect_uri=os.getenv("PROD_REDIRECT_URI"),
    client_kwargs={"scope": "openid email profile"}
)
