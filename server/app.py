
from config import app, api, jwt
from models import *
from routes import Signup, Login, Logout, UserProfile, GoogleLogin, GoogleAuthorize, TokenRefresh, DeleteUser, UserStats, CsrfToken
# DeleteUser
from routes.journalsroute import JournalsResource, JournalResource
from routes.entriesroute import EntryResource, AiPromptResource,CustomAiPromptResource, JournalEntriesResource
from routes.moodsroute import MoodsResource
import os
from flask import jsonify, request
from flask_jwt_extended import JWTManager
from flask_jwt_extended.exceptions import CSRFError

@app.before_request
def log_request_info():
    print(f"📥 {request.method} {request.path}")
    print(f"Cookies: {request.cookies}")
    print(f"Headers: {dict(request.headers)}")
    if request.method != "GET":
        try:
            print(f"Body: {request.get_json()}")
        except Exception as e:
            print(f"Failed to parse JSON: {e}")


@app.route("/")
def index():
    return {"message": "Luma backend is running!"}

api.add_resource(Signup, '/api/signup', endpoint="signup_api")
api.add_resource(Login, '/api/login', endpoint="login_api")
api.add_resource(Logout, '/api/logout', endpoint="logout_api")
api.add_resource(GoogleLogin, "/api/login/google", endpoint="google_login_api")
api.add_resource(GoogleAuthorize, "/api/authorize", endpoint="google_authorize_api")
api.add_resource(UserProfile, '/api/user/profile', endpoint="user_profile_api")
api.add_resource(UserStats, '/api/user/stats', endpoint="user_stats_api")
api.add_resource(DeleteUser, '/api/user/delete', endpoint="delete_user_api")
api.add_resource(CsrfToken, "/api/csrf-token")

api.add_resource(JournalsResource, '/api/journals', endpoint="journals_api")
# api.add_resource(JournalResource, '/api/journals/<int:journal_id>', endpoint="journal_api")

api.add_resource(EntryResource, '/api/entries', '/api/entries/<int:entry_id>', endpoint="entry_api")
api.add_resource(JournalEntriesResource, '/api/journals/<int:journal_id>/entries', endpoint="journal_entries_api")

api.add_resource(AiPromptResource, '/api/ai-prompt', endpoint="ai_prompt_api")
api.add_resource(CustomAiPromptResource, '/api/ai-prompt/custom', endpoint="custom_ai_prompt_api")

api.add_resource(MoodsResource, '/api/moods', endpoint="moods_api")
api.add_resource(TokenRefresh, '/api/refresh-token', endpoint="token_refresh_api")

from seed import seed_moods_if_empty

with app.app_context():
    db.create_all()
    seed_moods_if_empty()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5555))
    app.run(host="0.0.0.0", port=port)

@app.errorhandler(500)
def internal_error(e):
    app.logger.error(f"Server error: {e}")
    return jsonify({"error": "Internal Server Error"}), 500

@app.errorhandler(404)
def not_found_error(e):
    return jsonify({"error": "Not Found"}), 404

@jwt.unauthorized_loader
def handle_missing_token(reason):
    return jsonify(error="Missing access token", message=reason), 401

@jwt.invalid_token_loader
def handle_invalid_token(reason):
    return jsonify(error="Invalid token", message=reason), 422

@jwt.expired_token_loader
def handle_expired_token(jwt_header, jwt_payload):
    return jsonify(error="Token expired"), 401

@jwt.revoked_token_loader
def handle_revoked_token(jwt_header, jwt_payload):
    return jsonify(error="Token has been revoked"), 401

@jwt.needs_fresh_token_loader
def handle_fresh_token_required(jwt_header, jwt_payload):
    return jsonify(error="Fresh token required"), 401

@jwt.user_identity_loader
def handle_user_identity(identity):
    return str(identity)

@jwt.user_lookup_error_loader
def handle_user_lookup_error(jwt_header, jwt_payload):
    return jsonify(error="User not found"), 404

@app.errorhandler(CSRFError)
def handle_csrf_error(e):
    return jsonify(error="Invalid CSRF token", message=str(e)), 403

  
