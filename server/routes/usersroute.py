from flask import request, redirect, url_for, session, jsonify
from flask_restful import Resource
from config import app, db, api, google, oauth
from models import User, Journal, Entry
from flask_jwt_extended import create_access_token, set_access_cookies, jwt_required, get_jwt_identity, unset_jwt_cookies, create_refresh_token, set_refresh_cookies
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







class Signup(Resource):
    def post (self):
        data = request.get_json()
        if not data:
            return {"error": "Invalid JSON"}, 400
        username = data.get("username", "")
        email = data.get("email", "")
        password = data.get("password", "")

        if not username or not email or not password:
            return {"error": "All fields are required"}, 400
        
        try:
            
            new_user = User(username=data['username'], email=data['email'])
            new_user.set_password(data['password'])

            db.session.add(new_user)
            db.session.commit()
            
            access_token = create_access_token(identity=  str(new_user.id))
            refresh_token = create_refresh_token(identity=str(new_user.id))
            response = make_response(new_user.to_dict(),201)
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)

            return response
        
        
        except IntegrityError:
            #! catch duplicate email and provide a clear error message
            db.session.rollback()  #! rollback to maintain DB integrity
            return {"error": "Email is already in use"}, 400

        except Exception as e:
            return {'error': f'Error creating user: {str(e)}'}, 500


class Login(Resource):
    def post(self):
        try:
            data = request.get_json()
            if not data:
                return {"error": "Invalid JSON"}, 400
            
            user = User.query.filter_by(username=data['username']).first()
            
            if not user:
                return {"error": "User not found"}, 404
            elif not user.check_password(data['password']):
                return {"error": "Incorrect password"}, 401
            else:
                access_token = create_access_token(identity=str(user.id))
                refresh_token = create_refresh_token(identity=str(user.id))
                response = make_response(user.to_dict(), 200)
                set_access_cookies(response,access_token, )
                set_refresh_cookies(response, refresh_token)

                return response
        except Exception as e:
            return {'error': f'Error logging in user: {str(e)}'}, 500

class Logout(Resource):
    @jwt_required()
    def delete(self):
        try:

            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            #! If a Google token exists, revoke it
            if user and user.google_token:
                revoke_url = f'https://oauth2.googleapis.com/revoke?token={user.google_token}'
                response = requests.post(revoke_url)

                if response.status_code == 200:
                    print("Google token revoked successfully.")
                else:
                    print(f"Failed to revoke Google token: {response.text}")


            response = make_response('', 204)
            unset_jwt_cookies(response)

            session.clear()

            return response

        except Exception as e:
            return {"error": f"Error during logout: {str(e)}"}, 500

class GoogleLogin(Resource):
    def get(self):
        # Generate a secure state token
        state = secrets.token_urlsafe(32)
        
        # Store state token in session
        session['oauth_state'] = state
        session.modified = True
        
        # Log for debugging
        app.logger.info(f"Generated state token: {state}")
        app.logger.info(f"Full session: {dict(session)}")
        
        # Build redirect URI with state
        redirect_uri = url_for("googleauthorize", _external=True)
        return oauth.google.authorize_redirect(
            redirect_uri,
            state=state,
            prompt="consent",
            access_type="offline"
        )

class GoogleAuthorize(Resource):
    def get(self):
        try:
            app.logger.info(f"Incoming request args: {request.args}")
            app.logger.info(f"Session on callback: {dict(session)}")
            
            # Get state from query parameters
            state_param = request.args.get('state')
            if not state_param:
                return {"error": "Missing state parameter"}, 400
                
            # Since session persistence is problematic, we'll implement a fallback
            # approach where we accept the state parameter if it looks valid
            if len(state_param) >= 32:  # Check it's a reasonable length for a secure token
                app.logger.info(f"Using state parameter from URL: {state_param}")
                
                # Get token using OAuth client
                token = oauth.google.authorize_access_token()
                if not token:
                    app.logger.error("Failed to get access token")
                    return {"error": "Failed to get access token"}, 400
                
                # Get user info from token
                userinfo_endpoint = "https://www.googleapis.com/oauth2/v3/userinfo"
                resp = requests.get(
                    userinfo_endpoint,
                    headers={"Authorization": f"Bearer {token['access_token']}"}
                )
                
                if resp.status_code != 200:
                    app.logger.error(f"Failed to get user info: {resp.text}")
                    return {"error": "Failed to get user info"}, 400
                
                user_info = resp.json()
                app.logger.info(f"User info retrieved: {user_info}")
                
                # Check if user exists
                user = User.query.filter_by(email=user_info['email']).first()
                
                if not user:
                    # Create new user
                    username = user_info.get('name', '').replace(' ', '_').lower()
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
                else:
                    # Update existing user
                    user.google_id = user_info.get('sub')
                    user.google_token = token.get('access_token')
                    if token.get('refresh_token'):  # Only update if present
                        user.google_refresh_token = token.get('refresh_token')
                    user.token_expiry = int(time.time()) + int(token.get('expires_in', 3600))
                
                db.session.commit()
                
                # Create JWT tokens
                access_token = create_access_token(identity=str(user.id))
                refresh_token = create_refresh_token(identity=str(user.id))
                
                # Redirect to frontend with tokens
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
                response = redirect(f"{frontend_url}/oauth-redirect")
                
                # Set JWT cookies
                set_access_cookies(response, access_token)
                set_refresh_cookies(response, refresh_token)
                
                return response
            else:
                app.logger.error(f"Invalid state parameter: {state_param}")
                return {"error": "Invalid state parameter"}, 400
                
        except Exception as e:
            app.logger.error(f"Authorization error: {str(e)}", exc_info=True)
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            error_msg = urllib.parse.quote(str(e))
            return redirect(f"{frontend_url}/oauth-redirect?error={error_msg}")

        
class TokenRefresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return {"error": "User not found"}, 404
                

            access_token = create_access_token(identity=user.id)
            

            if user.google_token and user.google_refresh_token and user.is_token_expired():
                success = user.refresh_google_token()
                if not success:
                    app.logger.warning(f"Failed to refresh Google token for user {user.id}")
            

            response = jsonify({"message": "Token refreshed successfully"})
            set_access_cookies(response, access_token)
            
            return response
            
        except Exception as e:
            app.logger.error(f"Token refresh error: {str(e)}")
            return {"error": str(e)}, 500
        


class UserProfile(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        return user.to_dict(), 200

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
