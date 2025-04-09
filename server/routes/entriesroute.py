from config import db, api, app
from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Entry, Journal, Mood, EntryMood
from datetime import datetime
import random
import requests
import json

# Fallback prompts in case API fails
FALLBACK_PROMPTS = [
    "What was the most meaningful conversation you had today?",
    "Describe a moment today that made you feel grateful.",
    "What's something you learned or realized today?",
    "If you could change one decision you made today, what would it be?",
    "What's something that challenged you today and how did you handle it?"
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
        

    @jwt_required()
    def put(self, entry_id):
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

            # Update fields with the provided data
            title = data.get('title', entry.title)
            main_text = data.get('main_text', entry.main_text)
            ai_prompt_used = data.get('ai_prompt_used', entry.ai_prompt_used)
            mood_ids = data.get('mood_ids', [])

            # Update entry fields
            entry.title = title
            entry.main_text = main_text
            entry.ai_prompt_used = ai_prompt_used
            entry.updated_at = datetime.now()  # Update the timestamp

            # Update associated moods
            # Delete existing moods for the entry
            EntryMood.query.filter_by(entry_id=entry_id).delete()
            
            for mood_id in mood_ids:
                # Verify the mood exists
                mood = Mood.query.get(mood_id)
                if mood:
                    entry_mood = EntryMood(entry_id=entry_id, mood_id=mood_id)
                    db.session.add(entry_mood)

            db.session.commit()

            return entry.to_dict(), 200

        except Exception as e:
            db.session.rollback()
            return {"error": f"Error updating entry: {str(e)}"}, 500

class AiPromptResource(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            
            # Get Writecream API config from environment variables
            api_url = app.config.get("WRITECREAM_API_URL")
            api_key = app.config.get("WRITECREAM_API_KEY")
            tool_id = app.config.get("WRITECREAM_TOOL_ID")
            
            # Validate that the required configuration is available
            if not all([api_url, api_key, tool_id]):
                app.logger.error("Writecream API configuration missing")
                return {"prompt": random.choice(FALLBACK_PROMPTS), 
                        "note": "Using fallback prompt due to missing API configuration"}, 200
            
            # Get user's recent entries to generate a more personalized prompt
            user_entries = (
                Entry.query.join(Journal)
                .filter(Journal.user_id == current_user_id)
                .order_by(Entry.created_at.desc())
                .limit(3)
                .all()
            )
            
            # Generate context for the API based on user's moods if available
            context = "Generate a thoughtful journal prompt for self-reflection"
            
            # Add mood context if entries exist
            if user_entries:
                moods = []
                for entry in user_entries:
                    for mood in entry.moods:
                        moods.append(mood.name.lower())
                
                if moods:
                    # Get unique moods
                    unique_moods = list(set(moods))
                    if len(unique_moods) > 0:
                        mood_text = ", ".join(unique_moods[:3])  # Use up to 3 recent moods
                        context = f"Generate a thoughtful journal prompt for someone feeling {mood_text}"
            
            app.logger.info(f"Making Writecream API request with context: {context}")
            
            # Make API request to Writecream
            response = requests.post(
                api_url,
                headers={"Content-Type": "application/json"},
                data=json.dumps({
                    "key": api_key,
                    "tool_id": tool_id,
                    "tool_input": context
                }),
                timeout=5  # Set a timeout to prevent hanging requests
            )
            
            # Check if request was successful
            if response.status_code == 200:
                prompt_data = response.json()
                app.logger.info(f"Received API response: {prompt_data}")
                
                # Assuming the API returns a string or a field containing the prompt
                # Adjust this based on the actual API response structure
                if isinstance(prompt_data, str):
                    prompt = prompt_data
                elif isinstance(prompt_data, dict) and "output" in prompt_data:
                    prompt = prompt_data["output"]
                else:
                    # If the API response format is unexpected, use a fallback
                    prompt = random.choice(FALLBACK_PROMPTS)
                    app.logger.warning("Unexpected API response format, using fallback prompt")
                    
                return {"prompt": prompt}, 200
            else:
                # If API call fails, use a fallback prompt
                app.logger.warning(f"API returned status code {response.status_code}")
                prompt = random.choice(FALLBACK_PROMPTS)
                return {"prompt": prompt, 
                        "note": f"Using fallback prompt due to API response: {response.status_code}"}, 200
                
        except requests.exceptions.RequestException as e:
            # Handle request exceptions (timeout, connection error, etc.)
            app.logger.error(f"Request exception when calling Writecream API: {str(e)}")
            prompt = random.choice(FALLBACK_PROMPTS)
            return {"prompt": prompt, "note": "Using fallback prompt due to API connectivity issues"}, 200
        except Exception as e:
            # For any other exceptions, use fallback and log the error
            app.logger.error(f"Error in AI Prompt generation: {str(e)}")
            prompt = random.choice(FALLBACK_PROMPTS)
            return {"prompt": prompt, "note": "Using fallback prompt due to an error"}, 200