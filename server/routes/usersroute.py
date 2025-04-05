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

#! redirect user to googles oauth page
class GoogleLogin(Resource):
    def get(self):
        try:
            # Get state from frontend or generate new
            frontend_state = request.args.get('state')
            state = frontend_state or secrets.token_urlsafe(32)
            nonce = secrets.token_urlsafe(32)

            # Store in server-side session
            session['nonce'] = nonce
            session['state'] = state
            session.modified = True  # Force session save
            
            # Verify session storage
            print(f"Stored session state: {session['state']}")  # Debug
            
            return google.authorize_redirect(
                url_for("googleauthorize", _external=True),
                state=state,
                nonce=nonce
            )
        except Exception as e:
            return {"error": str(e)}, 500


class GoogleAuthorize(Resource):
    def get(self):
        try:
            # Get and validate state
            returned_state = request.args.get('state')
            stored_state = session.get('state')
            
            print(f"Comparing states - Stored: {stored_state}, Received: {returned_state}")  # Debug
            
            if not returned_state or returned_state != stored_state:
                return {"error": "Invalid state parameter"}, 400
            
            # Continue with token handling
            token = google.authorize_access_token()
            user_info = google.parse_id_token(token, nonce=session['nonce']) 
            #! Use nonce to verify the token 
            if not user_info:
                return {"error": "Failed to fetch user info"}, 400
            
            email = user_info["email"]
            username = user_info.get("name", email.split("@")[0])  #! Use name or part of email
            google_id = user_info.get("sub")  #! Google ID is typically in the 'sub' field, look into
            
            user = User.query.filter_by(email=email).first()
            
            if not user:
                user = User(username=username, email=email, google_id=google_id)
                db.session.add(user)
                db.session.commit()
            else:
                #! Update the google_id if it's not set yet
                if not user.google_id:
                    user.google_id = google_id
                    db.session.commit()

            user.set_google_token(token["access_token"])
            db.session.commit()


            access_token = create_access_token(identity=user.id)
            response = make_response(user.to_dict(), 200)
            set_access_cookies(response, access_token)
            session.pop('state', None)
            session.pop('nonce', None)
            session.modified = True  # Force session save
            #! Clear session data after use
            return response
        except Exception as e:
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