from config import db, api
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Entry, Journal, Mood
from datetime import datetime
class EntryResource(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()

            #! query entries where the related journal belongs to the current user
            entries = (
                Entry.query.join(Journal)
                .filter(Journal.user_id == current_user_id)
                .all()
            )
            if not entries:
                return {"message": "no entries found"}, 404

            return [entry.to_dict() for entry in entries], 200

        except Exception as e:
            return {"error": f"An error occurred while fetching entries: {str(e)}"}, 500
        

    @jwt_required()
    def post(self):
        try:
            data = request.get_json()
            current_user_id = get_jwt_identity()

            # Extract data from request
            title = data.get("title")
            content = data.get("main_text")
            journal_id = data.get("journal_id")
            ai_prompt_used = data.get("ai_prompt_used")
            mood_ids = data.get("moods", [])  # list of mood IDs
            created_at = datetime.utcnow()

            # Validate required fields
            if not title or not content or journal_id is None or ai_prompt_used is None:
                return {"error": "Missing required fields."}, 400

            # Query the moods based on IDs
            moods = Mood.query.filter(Mood.id.in_(mood_ids)).all()

            # Create the new entry
            new_entry = Entry(
                title=title,
                main_text=content,
                journal_id=journal_id,
                ai_prompt_used=ai_prompt_used,
                created_at=created_at,
                updated_at=created_at,
                moods=moods 
            )

            db.session.add(new_entry)
            db.session.commit()

            return new_entry.to_dict(), 201

        except Exception as e:
            return {"error": f"An error occurred while creating entry: {str(e)}"}, 500
        


