from datetime import datetime, timezone
from config import db

class OAuthState(db.Model):
    __tablename__ = 'oauth_states'
    
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.String(64), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    
    def is_valid(self):
        return not self.used and self.expires_at > datetime.now(timezone.utc)
    
    def mark_used(self):
        self.used = True