from config import db, api, app
from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Entry, Journal, Mood, EntryMood
from datetime import datetime
import random
import requests
import json
import os
from datetime import date

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
                entry = (
                    Entry.query.join(Journal)
                    .filter(Entry.id == entry_id, Journal.user_id == current_user_id)
                    .first()
                )
                
                if not entry:
                    return {"error": "Entry not found or access denied"}, 404
                
                return entry.to_dict(), 200
            else:

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
            
            #! Validate required fields
            title = data.get('title')
            journal_id = data.get('journal_id')
            mood_ids = data.get('mood_ids', [])
            ai_prompt_used = data.get('ai_prompt_used', False)
            
            if not title or not journal_id:
                return {"error": "Title and journal_id are required"}, 400
            
            #! Verify journal belongs to the current user
            journal = Journal.query.filter_by(id=journal_id, user_id=current_user_id).first()
            if not journal:
                return {"error": "Journal not found or access denied"}, 404
            
            new_entry = Entry(
                title=title,
                main_text="",  #* Will be updated in the editor
                created_at=datetime.now(),
                updated_at=datetime.now(),
                journal_id=journal_id,
                ai_prompt_used=ai_prompt_used
            )
            
            db.session.add(new_entry)
            db.session.flush()
            
            # Associate moods with the entry
            for mood_id in mood_ids:
                # Verify the mood exists
                mood = Mood.query.get(mood_id)
                if not mood:
                    continue
                
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
            
            #! Find the entry and verify ownership
            entry = (
                Entry.query.join(Journal)
                .filter(Entry.id == entry_id, Journal.user_id == current_user_id)
                .first()
            )
            
            if not entry:
                return {"error": "Entry not found or access denied"}, 404
            
            #! Only update fields that are present in the request
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
            
            entry = (
                Entry.query.join(Journal)
                .filter(Entry.id == entry_id, Journal.user_id == current_user_id)
                .first()
            )
            
            if not entry:
                return {"error": "Entry not found or access denied"}, 404
            
            EntryMood.query.filter_by(entry_id=entry_id).delete()
            
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

            entry = (
                Entry.query.join(Journal)
                .filter(Entry.id == entry_id, Journal.user_id == current_user_id)
                .first()
            )

            if not entry:
                return {"error": "Entry not found or access denied"}, 404

            title = data.get('title', entry.title)
            main_text = data.get('main_text', entry.main_text)
            ai_prompt_used = data.get('ai_prompt_used', entry.ai_prompt_used)
            mood_ids = data.get('mood_ids', [])

            entry.title = title
            entry.main_text = main_text
            entry.ai_prompt_used = ai_prompt_used
            entry.updated_at = datetime.now()  # Update the timestamp

            EntryMood.query.filter_by(entry_id=entry_id).delete()
            
            for mood_id in mood_ids:
                mood = Mood.query.get(mood_id)
                if mood:
                    entry_mood = EntryMood(entry_id=entry_id, mood_id=mood_id)
                    db.session.add(entry_mood)

            db.session.commit()

            return entry.to_dict(), 200

        except Exception as e:
            db.session.rollback()
            return {"error": f"Error updating entry: {str(e)}"}, 500
#!AI =============================================================== yay!

class AiPromptResource(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            
            # Get OpenRouter API config from environment variables
            api_key = os.getenv("MOONSHOT_API_KEY")
            api_url = os.getenv("MOONSHOT_API_URL") or "https://openrouter.ai/api/v1"
            
            # Validate that API key is available
            if not api_key:
                app.logger.error("OpenRouter API key missing")
                return {"prompt": random.choice(FALLBACK_PROMPTS), 
                        "note": "Using fallback prompt due to missing API configuration"}, 200
            
            # Check rate limiting
            # Store usage in a simple text file
            usage_file = "ai_prompt_usage.json"
            today = date.today().isoformat()
            
            try:
                if os.path.exists(usage_file):
                    with open(usage_file, "r") as f:
                        usage_data = json.load(f)
                else:
                    usage_data = {"date": today, "count": 0}
                    
                # Reset if it's a new day
                if usage_data["date"] != today:
                    usage_data = {"date": today, "count": 0}
                    
                # Check if we've hit the limit (conservative 45 requests per day)
                if usage_data["count"] >= 45:
                    app.logger.warning("Daily OpenRouter API limit reached")
                    return {"prompt": random.choice(FALLBACK_PROMPTS),
                            "note": "Using fallback prompt due to daily limit reached"}, 200
                            
                # Increment usage
                usage_data["count"] += 1
                
                # Save updated usage
                with open(usage_file, "w") as f:
                    json.dump(usage_data, f)
                    
            except Exception as e:
                app.logger.error(f"Error handling usage tracking: {str(e)}")
                # Continue execution even if tracking fails
            
            # Get user's recent entries to generate a more personalized prompt
            user_entries = (
                Entry.query.join(Journal)
                .filter(Journal.user_id == current_user_id)
                .order_by(Entry.created_at.desc())
                .limit(3)
                .all()
            )
            
            # Generate context for the API based on user's moods if available
            system_prompt = "You are a thoughtful journaling assistant. Generate a single, insightful journaling prompt that encourages self-reflection."
            user_prompt = "Create a journal prompt for today."
            
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
                        user_prompt = f"Create a journal prompt for someone feeling {mood_text}."
            
            app.logger.info(f"Making OpenRouter API request with context: {user_prompt}")
            
            # Make API request to OpenRouter
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": request.headers.get("Origin", "http://localhost:5173"),
                "X-Title": "Luma"
            }
            
            payload = {
                "model": "moonshotai/kimi-vl-a3b-thinking:free",
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
                "max_tokens": 80  # Keep responses short
            }
            
            response = requests.post(
                f"{api_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=5  # Set a timeout to prevent hanging requests
            )
            
            # Check if request was successful
            if response.status_code == 200:
                prompt_data = response.json()
                app.logger.info(f"Received API response: {prompt_data}")
                
                try:
                    prompt = prompt_data["choices"][0]["message"]["content"].strip()
                    return {"prompt": prompt}, 200
                except (KeyError, IndexError) as e:
                    app.logger.error(f"Error parsing API response: {str(e)}")
                    prompt = random.choice(FALLBACK_PROMPTS)
                    return {"prompt": prompt, "note": "Error parsing API response"}, 200
            else:
                # If API call fails, use a fallback prompt
                app.logger.warning(f"API returned status code {response.status_code}")
                prompt = random.choice(FALLBACK_PROMPTS)
                return {"prompt": prompt, 
                        "note": f"Using fallback prompt due to API response: {response.status_code}"}, 200
                
        except requests.exceptions.RequestException as e:
            app.logger.error(f"Request exception when calling OpenRouter API: {str(e)}")
            prompt = random.choice(FALLBACK_PROMPTS)
            return {"prompt": prompt, "note": "Using fallback prompt due to API connectivity issues"}, 200
        except Exception as e:
            app.logger.error(f"Error in AI Prompt generation: {str(e)}")
            prompt = random.choice(FALLBACK_PROMPTS)
            return {"prompt": prompt, "note": "Using fallback prompt due to an error"}, 200