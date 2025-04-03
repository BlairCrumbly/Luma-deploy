from flask import request, redirect, url_for, session
from flask_restful import Resource
from config import app, db, api, google
from models import User
from flask_jwt_extended import create_access_token, set_access_cookies, jwt_required, get_jwt_identity, unset_jwt_cookies
from flask import make_response
from sqlalchemy.exc import IntegrityError
import secrets
import re

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
        response = make_response('', 204)
        unset_jwt_cookies(response)
        return response

#! redirect user to googles oauth page
class GoogleLogin(Resource):
    def get(self):
        nonce = secrets.token_urlsafe(32)  # Generate a secure nonce
        state = secrets.token_urlsafe(32)  # Generate a secure state

        session['nonce'] = nonce  # Store nonce in session
        session['state'] = state  # Store state in session
        session.modified = True  # Ensure session is saved

        return google.authorize_redirect(
            url_for("googleauthorize", _external=True),
            state=state,  # Pass state for CSRF protection
            nonce=nonce   # Explicitly pass nonce
        )


class GoogleAuthorize(Resource):
    def get(self):
        try:
            token = google.authorize_access_token()  # Get access token from Google
            user_info = google.parse_id_token(token, nonce=session['nonce'])  # Ensure nonce is passed
            if not user_info:
                return {"error": "Failed to fetch user info"}, 400
            
            email = user_info["email"]
            username = user_info.get("name", email.split("@")[0])  # Use name or part of email
            google_id = user_info.get("sub")  # Google ID is typically in the 'sub' field
            
            user = User.query.filter_by(email=email).first()
            
            if not user:
                user = User(username=username, email=email, google_id=google_id)  # Store google_id
                db.session.add(user)
                db.session.commit()
            else:
                # Update the google_id if it's not set yet
                if not user.google_id:
                    user.google_id = google_id
                    db.session.commit()

            access_token = create_access_token(identity=user.id)
            response = make_response(user.to_dict(), 200)
            set_access_cookies(response, access_token)

            return response
        except Exception as e:
            return {"error": str(e)}, 500




class UserProfile(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        return user.to_dict(), 200



