from config import app, api
from models import *
from routes import Signup, Login, Logout, UserProfile, GoogleLogin, GoogleAuthorize, TokenRefresh, DeleteUser, UserStats
# DeleteUser
from routes.journalsroute import JournalsResource, JournalResource
from routes.entriesroute import EntryResource, AiPromptResource,CustomAiPromptResource, JournalEntriesResource
from routes.moodsroute import MoodsResource

api.add_resource(Signup, '/api/signup')
api.add_resource(Login, '/api/login')
api.add_resource(Logout, '/api/logout')
api.add_resource(GoogleLogin, "/api/login/google")
api.add_resource(GoogleAuthorize, "/api/authorize", endpoint="googleauthorize")
api.add_resource(UserProfile, '/api/user/profile')
api.add_resource(UserStats, '/api/user/stats')
api.add_resource(DeleteUser, '/api/user/delete')

api.add_resource(JournalsResource, '/api/journals')
api.add_resource(JournalResource, '/api/journals/<int:journal_id>')

api.add_resource(EntryResource, '/api/entries', '/api/entries/<int:entry_id>')
api.add_resource(JournalEntriesResource, '/api/journals/<int:journal_id>/entries')

api.add_resource(AiPromptResource, '/api/ai-prompt')
api.add_resource(CustomAiPromptResource, '/api/ai-prompt/custom')

api.add_resource(MoodsResource, '/api/moods')
api.add_resource(TokenRefresh, '/api/refresh-token')



if __name__ == "__main__":
  app.run(port=5555, debug=True)
