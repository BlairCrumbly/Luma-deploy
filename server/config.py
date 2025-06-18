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


# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def index(path):
#     return render_template("index.html")

app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config['JWT_COOKIE_NAME'] = 'access_token_cookie'
app.config["JWT_SECRET_KEY"] = os.getenv('JWT_SECRET_KEY')
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = True  # Changed to True
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_COOKIE_SECURE"] = False  # True in production
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=30)
app.config["SESSION_FILE_THRESHOLD"] = 100  # To prevent too many session files
app.config["SESSION_COOKIE_DOMAIN"] = None 

#ai stuff :P

app.config["WRITECREAM_API_URL"] = os.getenv("WRITECREAM_API_URL")
app.config["WRITECREAM_API_KEY"] = os.getenv("WRITECREAM_API_KEY")
app.config["WRITECREAM_TOOL_ID"] = os.getenv("WRITECREAM_TOOL_ID")

sess = Session(app)

db = SQLAlchemy(app=app, metadata=metadata)

jwt = JWTManager(app)

migrate = Migrate(app=app, db=db)

bcrypt = Bcrypt(app=app)

api = Api(app=app)

# Updated CORS configuration to allow X-CSRF-TOKEN header
CORS(app, 
     supports_credentials=True, 
     origins=["https://luma-deploy-frontend.onrender.com"],
     allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN"],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])

oauth = OAuth(app)

google = oauth.register(
    name='google',
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    redirect_uri=os.getenv("PROD_REDIRECT_URI"), 
    client_kwargs={"scope": "openid email profile"}
)

# Updated after_request to include X-CSRF-TOKEN in allowed headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://luma-deploy-frontend.onrender.com')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CSRF-TOKEN')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    return response