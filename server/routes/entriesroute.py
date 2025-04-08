from config import db, api
from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Entry, Journal, Mood, EntryMood
from datetime import datetime
import random

# AI prompts list - we would normally integrate with an actual AI service
AI_PROMPTS = [
    "What was the most meaningful conversation you had today?",
    "Describe a moment today that made you feel grateful.",
    "What's something you learned or realized today?",
    "If you could change one decision you made today, what would it be?",
    "What's something that challenged you today and how did you handle it?",
    "Write about something that brought you joy today.",
    "Reflect on a mistake you made recently and what you learned from it.",
    "What's something you're looking forward to in the near future?",
    "Describe your current emotional state and what might have led to it.",
    "What's one thing you'd like to remember about today?"
]

class EntryResource(Resource):
    @jwt_required()
    def get(self, entry_id=None):
        try:
            current_user_id = get_jwt_identity()

            if entry_id:
                # Get a specific entry
                entry = (
                    Entry.query.join(Journal)
                    .filter(Entry.id == entry_id, Journal.user_id == current_user_id)
                    .first()
                )
                
                if not entry:
                    return {"error": "Entry not found or access denied"}, 404
                
                return entry.to_dict(), 200
            else:
                # Get all entries for the user
                entries = (
                    Entry.query.join(Journal)
                    .filter(Journal.user_id == current_user_id)
                    .all()
                )
                
                if not entries:
                    return {"message": "No entries found"}, 404
                
                return [entry.to_dict() for entry in entries], 200

        except Exception as e:
            return {"error": f"An error occurred while fetching entries: {str(e)}"}, 500
        
    @jwt_required()
    def post(self):
        try:
            data = request.get_json()
            current_user_id = get_jwt_identity()
            
            # Validate required fields
            title = data.get('title')
            journal_id = data.get('journal_id')
            mood_ids = data.get('mood_ids', [])
            ai_prompt_used = data.get('ai_prompt_used', False)
            
            if not title or not journal_id:
                return {"error": "Title and journal_id are required"}, 400
            
            # Verify journal belongs to the current user
            journal = Journal.query.filter_by(id=journal_id, user_id=current_user_id).first()
            if not journal:
                return {"error": "Journal not found or access denied"}, 404
            
            # Create new entry
            new_entry = Entry(
                title=title,
                main_text="",  # Will be updated in the editor
                created_at=datetime.now(),
                updated_at=datetime.now(),
                journal_id=journal_id,
                ai_prompt_used=ai_prompt_used
            )
            
            db.session.add(new_entry)
            db.session.flush()  # Get the ID without committing
            
            # Associate moods with the entry
            for mood_id in mood_ids:
                # Verify the mood exists
                mood = Mood.query.get(mood_id)
                if not mood:
                    continue  # Skip invalid moods
                
                entry_mood = EntryMood(entry_id=new_entry.id, mood_id=mood_id)
                db.session.add(entry_mood)
            
            db.session.commit()
            return new_entry.to_dict(), 201
            
        except ValueError as ve:
            return {"error": str(ve)}, 400
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error creating entry: {str(e)}"}, 500
    
    @jwt_required()
    def patch(self, entry_id):
        try:
            data = request.get_json()
            current_user_id = get_jwt_identity()
            
            # Find the entry and verify ownership
            entry = (
                Entry.query.join(Journal)
                .filter(Entry.id == entry_id, Journal.user_id == current_user_id)
                .first()
            )
            
            if not entry:
                return {"error": "Entry not found or access denied"}, 404
            
            # Only update fields that are present in the request
            if 'main_text' in data:
                entry.main_text = data['main_text']
                entry.updated_at = datetime.now()
            
            db.session.commit()
            return entry.to_dict(), 200
            
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error updating entry: {str(e)}"}, 500

    @jwt_required()
    def delete(self, entry_id):
        try:
            current_user_id = get_jwt_identity()
            
            # Find the entry and verify ownership
            entry = (
                Entry.query.join(Journal)
                .filter(Entry.id == entry_id, Journal.user_id == current_user_id)
                .first()
            )
            
            if not entry:
                return {"error": "Entry not found or access denied"}, 404
            
            # Delete associated entry_moods first
            EntryMood.query.filter_by(entry_id=entry_id).delete()
            
            # Delete the entry
            db.session.delete(entry)
            db.session.commit()
            
            return {"message": "Entry deleted successfully"}, 200
            
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error deleting entry: {str(e)}"}, 500

class AiPromptResource(Resource):
    @jwt_required()
    def get(self):
        try:
            # In a real implementation, this could call an external AI service
            # For now, just return a random prompt from our predefined list
            prompt = random.choice(AI_PROMPTS)
            return {"prompt": prompt}, 200
        except Exception as e:
            return {"error": f"Error generating AI prompt: {str(e)}"}, 500