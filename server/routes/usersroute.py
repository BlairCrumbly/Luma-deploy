from flask import request, redirect, url_for, session
from flask_restful import Resource
from config import app, db, api, google
from models import User
from flask_jwt_extended import create_access_token, set_access_cookies, jwt_required, get_jwt_identity, unset_jwt_cookies
from flask import make_response
from sqlalchemy.exc import IntegrityError
import secrets
import re
import requests
import urllib.parse
import os



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
            
            access_token = create_access_token(identity=new_user.id)
            response = make_response(new_user.to_dict(),201)
            set_access_cookies(response, access_token)
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
                access_token = create_access_token(identity=user.id)
                response = make_response(user.to_dict(), 200)
                set_access_cookies(response,access_token)
                return response
        except Exception as e:
            return {'error': f'Error logging in user: {str(e)}'}, 500

class Logout(Resource):
    @jwt_required()
    def delete(self):
        try:
            # Get the current user ID from JWT identity
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            # If a Google token exists, revoke it
            if user and user.google_token:
                revoke_url = f'https://oauth2.googleapis.com/revoke?token={user.google_token}'
                response = requests.post(revoke_url)

                if response.status_code == 200:
                    print("Google token revoked successfully.")
                else:
                    print(f"Failed to revoke Google token: {response.text}")

            # Prepare response and unset JWT cookies
            response = make_response('', 204)
            unset_jwt_cookies(response)

            # Clear session or any additional user-related data here
            # (if you use session-based storage for other info)
            session.clear()

            return response

        except Exception as e:
            return {"error": f"Error during logout: {str(e)}"}, 500

class GoogleLogin(Resource):
    def get(self):
        # Generate a secure random string for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Store state in a session cookie that will be sent back to the client
        session['oauth_state'] = state
        session.modified = True
        
        # Generate a nonce for OpenID Connect
        nonce = secrets.token_urlsafe(32)
        session['oauth_nonce'] = nonce
        
        # Redirect to Google OAuth with the correct scope format
        redirect_uri = url_for("googleauthorize", _external=True)
        
        # Use the standard OAuth2 scope format
        scope = "openid email profile"
        
        # Manual OAuth configuration to ensure correct parameters
        authorize_url = "https://accounts.google.com/o/oauth2/auth"
        client_id = os.getenv("CLIENT_ID")
        
        params = {
            "client_id": client_id,
            "response_type": "code",
            "scope": scope,
            "redirect_uri": redirect_uri,
            "state": state,
            "nonce": nonce,
            "access_type": "offline",
            "include_granted_scopes": "true"
        }
        
        auth_url = f"{authorize_url}?{urllib.parse.urlencode(params)}"
        return redirect(auth_url)


class GoogleAuthorize(Resource):
    def get(self):
        try:
            # Verify state parameter to prevent CSRF
            state_param = request.args.get('state')
            stored_state = session.get('oauth_state')
            
            if not state_param or not stored_state or state_param != stored_state:
                return {"error": "Invalid state parameter. CSRF protection triggered."}, 400
            
            # Exchange code for token
            code = request.args.get('code')
            if not code:
                return {"error": "Authorization code not provided"}, 400
            
            # Get the token using the code
            token_url = "https://oauth2.googleapis.com/token"
            client_id = os.getenv("CLIENT_ID")
            client_secret = os.getenv("CLIENT_SECRET")
            redirect_uri = url_for("googleauthorize", _external=True)
            
            token_data = {
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }
            
            token_response = requests.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                return {"error": f"Failed to obtain token: {token_response.text}"}, 500
                
            token_json = token_response.json()
            
            # Get user info with the access token
            user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {token_json['access_token']}"}
            user_info_response = requests.get(user_info_url, headers=headers)
            
            if user_info_response.status_code != 200:
                return {"error": "Failed to fetch user info"}, 500
                
            user_info = user_info_response.json()
            
            # Process user info
            email = user_info["email"]
            username = user_info.get("name", email.split("@")[0])
            google_id = user_info.get("sub")
            
            user = User.query.filter_by(email=email).first()
            
            if not user:
                user = User(username=username, email=email, google_id=google_id)
                db.session.add(user)
                db.session.commit()
            else:
                if not user.google_id:
                    user.google_id = google_id
                    db.session.commit()
            
            # Save the access token if needed
            user.set_google_token(token_json.get("access_token"))
            db.session.commit()
            
            # Create JWT for your app authentication
            access_token = create_access_token(identity=user.id)
            
            # Set cookies in a response
            response = make_response(user.to_dict(), 200)
            set_access_cookies(response, access_token)
            
            # Clean up session
            if 'oauth_state' in session:
                session.pop('oauth_state')
            if 'oauth_nonce' in session:
                session.pop('oauth_nonce')
                
            # Add CORS headers to allow your frontend to access this response
            response.headers.add('Access-Control-Allow-Origin', os.getenv('FRONTEND_URL', 'http://localhost:5173'))
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            
            # Redirect to homepage or return the response as needed
            return redirect('http://localhost:5173/home')  # Adjust this URL as necessary

        except Exception as e:
            app.logger.error(f"Google OAuth error: {str(e)}")
            return {"error": str(e)}, 500
        


class UserProfile(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        return user.to_dict(), 200


class DeleteUser(Resource):
    @jwt_required()
    def delete(self):
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get_or_404(current_user_id)
            
            # Optional: Delete related journals if necessary
            # for journal in user.journals:
            #     db.session.delete(journal)
            
            db.session.delete(user)
            db.session.commit()
            
            response = make_response({"message": "User account deleted successfully"}, 200)
            unset_jwt_cookies(response)
            return response
        
        except Exception as e:
            return {"error": f"Error deleting user: {str(e)}"}, 500