from config import app, api
from models import *
from routes import Signup, Login, Logout, UserProfile, GoogleLogin, GoogleAuthorize


api.add_resource(Signup, '/signup')
api.add_resource(Login, '/login')
api.add_resource(Logout, '/logout')
api.add_resource(GoogleLogin, "/login/google")
api.add_resource(GoogleAuthorize, "/authorize", endpoint="googleauthorize")
api.add_resource(UserProfile, '/user/profile')

if __name__ == "__main__":
  app.run(port=5555, debug=True)
