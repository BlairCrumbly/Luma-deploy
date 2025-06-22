from flask import request, redirect, url_for, session, jsonify, current_app
from flask_restful import Resource
from config import app, db, api, google, oauth
from models import User, Journal, Entry
from flask_jwt_extended import create_access_token, set_access_cookies, jwt_required, get_jwt_identity, unset_jwt_cookies, create_refresh_token, set_refresh_cookies, get_csrf_token
from flask import make_response
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
import secrets
import re
import requests
import urllib.parse
import os
import time
import traceback
from werkzeug.security import generate_password_hash, check_password_hash

class Signup(Resource):
    def post(self):
        try:
            data = request.get_json()
            if not data:
                return {"error": "Invalid JSON"}, 400
                
            username = data.get('username', '').strip()
            email = data.get('email', '').strip().lower()
            password = data.get('password')

            if not all([username, email, password]):
                return {"error": "All fields required"}, 400

            if User.query.filter_by(username=username).first():
                return {"error": "Username already exists"}, 400
            
            if User.query.filter_by(email=email).first():
                return {"error": "Email already exists"}, 400
            
            new_user = User(
                username=username,
                email=email,
                password=generate_password_hash(password)
            )
            
            db.session.add(new_user)
            db.session.commit()

            access_token = create_access_token(identity=str(new_user.id))
            refresh_token = create_refresh_token(identity=str(new_user.id))
            
            response = jsonify({
                "message": "Signup successful",
                "user": new_user.to_dict()
            })
            
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)
            return response
            
        except IntegrityError:
            db.session.rollback()
            return {"error": "Email is already in use"}, 400
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Signup error: {str(e)}")
            return {"error": "Signup failed"}, 500

class Login(Resource):
    def post(self):
        try:
            data = request.get_json()
            if not data:
                return {"error": "Invalid JSON"}, 400

            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return {"error": "Username and password required"}, 400

            user = User.query.filter_by(username=username).first()
            
            if not user or not user.check_password(password):
                return {"error": "Invalid credentials"}, 401

            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            response = jsonify({
                "message": "Login successful",
                "user": user.to_dict()
            })
            
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)
            return response
            
        except Exception as e:
            current_app.logger.error(f"Login error: {str(e)}")
            return {"error": "Login failed"}, 500

class Logout(Resource):
    @jwt_required()
    def delete(self):
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            if user and user.google_token:
                try:
                    revoke_url = f'https://oauth2.googleapis.com/revoke?token={user.google_token}'
                    requests.post(revoke_url, timeout=5)
                except Exception as e:
                    current_app.logger.error(f"Error revoking Google token: {str(e)}")

            response = jsonify({"message": "Logout successful"})
            unset_jwt_cookies(response)
            session.clear()
            return response
            
        except Exception as e:
            current_app.logger.error(f"Logout error: {str(e)}")
            return {"error": "Logout failed"}, 500

class GoogleLogin(Resource):
    def get(self):
        try:
            # Generate a secure state token
            state = secrets.token_urlsafe(32)
            
            # Store state token in session
            session['oauth_state'] = state
            session.permanent = True
            
            app.logger.info(f"Generated state token: {state}")
            
            # Build redirect URI
            redirect_uri = url_for("google_authorize_api", _external=True)
            
            return oauth.google.authorize_redirect(
                redirect_uri,
                state=state,
                prompt="consent",
                access_type="offline"
            )
        except Exception as e:
            app.logger.error(f"Google login error: {str(e)}")
            return {"error": "Failed to initiate Google login"}, 500

class GoogleAuthorize(Resource):
    def get(self):
        try:
            app.logger.info(f"Incoming request args: {request.args}")
            app.logger.info(f"Session on callback: {dict(session)}")
            
            # Get state from query parameters
            state_param = request.args.get('state')
            if not state_param:
                app.logger.error("Missing state parameter")
                return self._redirect_with_error("Missing state parameter")
                
            # Verify state (with fallback for session issues)
            session_state = session.get('oauth_state')
            if session_state and session_state != state_param:
                app.logger.error(f"State mismatch. Session: {session_state}, Param: {state_param}")
                return self._redirect_with_error("Invalid state parameter")
            
            # Check for authorization errors
            error = request.args.get('error')
            if error:
                app.logger.error(f"OAuth authorization error: {error}")
                return self._redirect_with_error(f"Authorization failed: {error}")
            
            # Get authorization code
            code = request.args.get('code')
            if not code:
                app.logger.error("Missing authorization code")
                return self._redirect_with_error("Missing authorization code")
            
            # Exchange code for token
            try:
                token = oauth.google.authorize_access_token()
                if not token:
                    app.logger.error("Failed to get access token")
                    return self._redirect_with_error("Failed to get access token")
                
                app.logger.info("Successfully obtained access token")
                
            except Exception as e:
                app.logger.error(f"Token exchange error: {str(e)}")
                return self._redirect_with_error("Failed to exchange authorization code")
            
            # Get user info from Google
            try:
                userinfo_endpoint = "https://www.googleapis.com/oauth2/v3/userinfo"
                resp = requests.get(
                    userinfo_endpoint,
                    headers={"Authorization": f"Bearer {token['access_token']}"},
                    timeout=10
                )
                
                if resp.status_code != 200:
                    app.logger.error(f"Failed to get user info: {resp.text}")
                    return self._redirect_with_error("Failed to get user information")
                
                user_info = resp.json()
                app.logger.info(f"User info retrieved: {user_info.get('email', 'no email')}")
                
            except Exception as e:
                app.logger.error(f"Error getting user info: {str(e)}")
                return self._redirect_with_error("Failed to retrieve user information")
            
            # Find or create user
            try:
                user = User.query.filter_by(email=user_info['email']).first()
                
                if not user:
                    # Create new user
                    username = user_info.get('name', '').replace(' ', '_').lower()
                    if not username:
                        username = user_info['email'].split('@')[0]
                    
                    # Make username unique
                    base_username = username
                    counter = 1
                    while User.query.filter_by(username=username).first():
                        username = f"{base_username}{counter}"
                        counter += 1
                    
                    user = User(
                        username=username,
                        email=user_info['email'],
                        google_id=user_info.get('sub'),
                        google_token=token.get('access_token'),
                        google_refresh_token=token.get('refresh_token'),
                        token_expiry=int(time.time()) + int(token.get('expires_in', 3600))
                    )
                    db.session.add(user)
                    app.logger.info(f"Created new user: {user.email}")
                else:
                    # Update existing user
                    user.google_id = user_info.get('sub')
                    user.google_token = token.get('access_token')
                    if token.get('refresh_token'):
                        user.google_refresh_token = token.get('refresh_token')
                    user.token_expiry = int(time.time()) + int(token.get('expires_in', 3600))
                    app.logger.info(f"Updated existing user: {user.email}")
                
                db.session.commit()
                
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"Database error: {str(e)}")
                return self._redirect_with_error("Database error occurred")
            
            # Create JWT tokens
            try:
                access_token = create_access_token(identity=str(user.id))
                refresh_token = create_refresh_token(identity=str(user.id))
                
                # Clean up session
                session.pop('oauth_state', None)
                
                # Redirect to frontend with cookies set
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
                response = redirect(f"{frontend_url}/oauth-redirect")
                
                # Set JWT cookies
                set_access_cookies(response, access_token)
                set_refresh_cookies(response, refresh_token)
                
                app.logger.info(f"Successfully authenticated user: {user.email}")
                return response
                
            except Exception as e:
                app.logger.error(f"JWT token creation error: {str(e)}")
                return self._redirect_with_error("Authentication token creation failed")
                
        except Exception as e:
            app.logger.error(f"Unexpected authorization error: {str(e)}")
            app.logger.error(traceback.format_exc())
            return self._redirect_with_error("An unexpected error occurred")

    def _redirect_with_error(self, error_message):
        """Helper method to redirect to frontend with error message"""
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        error_encoded = urllib.parse.quote(error_message)
        return redirect(f"{frontend_url}/oauth-redirect?error={error_encoded}")

class TokenRefresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        try:
            current_user_id = get_jwt_identity()
            new_access_token = create_access_token(identity=current_user_id)
            
            response = jsonify({"message": "Token refreshed"})
            set_access_cookies(response, new_access_token)
            return response
            
        except Exception as e:
            current_app.logger.error(f"Token refresh error: {str(e)}")
            return {"error": "Token refresh failed"}, 500
        



class CsrfToken(Resource):
    def get(self):
        """Generate CSRF tokens for anonymous users"""
        try:
            # Create a temporary token with CSRF protection enabled
            temp_token = create_access_token(identity="anonymous", expires_delta=False)

            # Extract CSRF token from the temp token
            csrf_token = get_csrf_token(temp_token)

            response = jsonify({
                "message": "CSRF tokens generated",
                "csrf_token": csrf_token
            })

            # Set the access token cookie (includes HttpOnly csrf_access_token)
            set_access_cookies(response, temp_token)

            # 👇 Set a readable CSRF cookie for the frontend to pick up
            response.set_cookie(
                "csrf_token_client",
                csrf_token,
                httponly=False,        # must be accessible to JS
                secure=True,           # only over HTTPS
                samesite="None",       # allow cross-site
                path="/"
            )

            return response

        except Exception as e:
            current_app.logger.error(f"Failed to generate CSRF token: {str(e)}")
            return {"error": "Failed to generate CSRF token"}, 500

class UserProfile(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            
            if current_user_id == "anonymous":
                return {"error": "Authentication required"}, 401
                
            user = User.query.get(current_user_id)
            if not user:
                return {"error": "User not found"}, 404
                
            return user.to_dict(), 200
            
        except Exception as e:
            current_app.logger.error(f"Profile error: {str(e)}")
            return {"error": "Failed to get profile"}, 500


class UserStats(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        
        #! Count journals
        journal_count = Journal.query.filter_by(user_id=user.id).count()
        
        #! Count entries
        entry_count = db.session.query(func.count(Entry.id)).join(Journal).filter(Journal.user_id == user.id).scalar() or 0
        
        #! Calculate streaks
        streaks = self._calculate_streaks(user.id)
        
        return {
            "journal_count": journal_count,
            "entry_count": entry_count,
            "longest_streak": streaks["longest_streak"],
            "current_streak": streaks["current_streak"]
        }, 200
    
    def _calculate_streaks(self, user_id):
        entry_dates_query = db.session.query(
            func.date(Entry.created_at).label('entry_date')
        ).join(Journal).filter(
            Journal.user_id == user_id
        ).group_by(
            func.date(Entry.created_at)
        ).order_by(
            func.date(Entry.created_at)
        ).all()
        
        try:
            entry_dates = [
                datetime.strptime(row.entry_date, "%Y-%m-%d").date() 
                for row in entry_dates_query
            ]
        except Exception as e:
            app.logger.error(f"Error parsing entry dates: {e}")
            return {"longest_streak": 0, "current_streak": 0}

        if not entry_dates:
            return {"longest_streak": 0, "current_streak": 0}
        
        #! Calculate longest streak
        longest_streak = 1
        current_streak = 1
        streak_count = 1
        
        for i in range(1, len(entry_dates)):
            if (entry_dates[i] - entry_dates[i-1]).days == 1:
                streak_count += 1
            else:
                #! Reset streak if gap in dates
                streak_count = 1
            
            longest_streak = max(longest_streak, streak_count)
        
        
        today = datetime.now().date()
        
        
        if entry_dates[-1] == today:
            current_streak = 1
            
            for i in range(len(entry_dates) - 2, -1, -1):
                if (entry_dates[i+1] - entry_dates[i]).days == 1:
                    current_streak += 1
                else:
                    break
        
        elif entry_dates[-1] == (today - timedelta(days=1)):
            current_streak = 1
            
            for i in range(len(entry_dates) - 2, -1, -1):
                if (entry_dates[i+1] - entry_dates[i]).days == 1:
                    current_streak += 1
                else:
                    break
        else:
            current_streak = 0
        
        return {
            "longest_streak": longest_streak,
            "current_streak": current_streak
        }

class DeleteUser(Resource):
    @jwt_required()
    def delete(self):
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get_or_404(current_user_id)
            
            
            db.session.delete(user)
            db.session.commit()
            
            response = make_response({"message": "User account deleted successfully"}, 200)
            unset_jwt_cookies(response)
            return response
        
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error deleting user: {str(e)}"}, 500
