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
                
            # Add this to handle title updates
            if 'title' in data:
                entry.title = data['title']
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
        

class JournalEntriesResource(Resource):
    @jwt_required()
    def get(self, journal_id):
        # Get the current user ID from the JWT
        current_user_id = get_jwt_identity()

        # Make sure the journal exists and belongs to the current user.
        journal = Journal.query.filter_by(id=journal_id, user_id=current_user_id).first()
        if not journal:
            return {"error": "Journal not found"}, 404

        # Query for entries that belong to the journal.
        entries = Entry.query.filter_by(journal_id=journal_id).all()
        if not entries:
            return {"message": "No entries found for this journal"}, 404

        # Convert each entry to a serializable dictionary
        entries_data = [entry.to_dict() for entry in entries]
        return {"entries": entries_data}, 200

#!AI =============================================================== yay!

class AiPromptResource(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            
            # Get Writecream API config
            api_key = os.getenv("api_key")
            tool_id = os.getenv("tool_id")
            api_url = os.getenv("api_url")
            
            # Validate that API key is available
            if not api_key or not tool_id:
                app.logger.error("Writecream API configuration missing")
                return {"prompt": random.choice(FALLBACK_PROMPTS), 
                        "note": "Using fallback prompt due to missing API configuration"}, 200
            
            # Check rate limiting - keep this functionality
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
                    
                # Check if we've hit the limit (45 requests per day)
                if usage_data["count"] >= 45:
                    app.logger.warning("Daily API limit reached")
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
            
            # Get user's recent entries to generate contextual prompt
            user_entries = (
                Entry.query.join(Journal)
                .filter(Journal.user_id == current_user_id)
                .order_by(Entry.created_at.desc())
                .limit(3)
                .all()
            )
            
            # Start with a strong base prompt
            tool_input = "Give me a thought-provoking journaling prompt that encourages deep reflection"
            
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
                        tool_input = f"Give me a thought-provoking journaling prompt for someone feeling {mood_text} that encourages deep reflection"
            
            app.logger.info(f"Making Writecream API request with input: {tool_input}")
            
            # Make API request to Writecream
            headers = {
                "Content-Type": "application/json"
            }
            
            payload = {
                "key": api_key,
                "tool_id": tool_id,
                "tool_input": tool_input
            }
            
            response = requests.post(
                api_url,
                headers=headers,
                json=payload,
                timeout=10  # Set a timeout to prevent hanging requests
            )
            
            # Check if request was successful
            if response.status_code == 200:
                prompt_data = response.json()
                app.logger.info(f"Received API response: {prompt_data}")
                
                try:
                    # Extract the prompt from the response based on structure
                    prompt = None
                    
                    # Try different ways to extract the prompt based on possible response formats
                    if isinstance(prompt_data, str):
                        prompt = prompt_data.strip()
                    elif isinstance(prompt_data, dict):
                        if "output" in prompt_data:
                            prompt = prompt_data["output"].strip()
                        elif "result" in prompt_data:
                            prompt = prompt_data["result"].strip()
                        elif "prompt" in prompt_data:
                            prompt = prompt_data["prompt"].strip()
                        elif "content" in prompt_data:
                            prompt = prompt_data["content"].strip()
                        elif "text" in prompt_data:
                            prompt = prompt_data["text"].strip()
                        # If none of the above keys exist, try to use the whole response
                        else:
                            prompt = str(prompt_data).strip()
                    else:
                        prompt = str(prompt_data).strip()
                    
                    # If we couldn't extract a prompt or it's too short, use a fallback
                    if not prompt or len(prompt) < 10:
                        app.logger.warning("Received empty or very short prompt from API")
                        prompt = random.choice(FALLBACK_PROMPTS)
                    
                    # Ensure the prompt doesn't contain the default "What would you like to write about today?"
                    if "what would you like to write about today" in prompt.lower():
                        app.logger.warning("Received default prompt from API, using fallback")
                        prompt = random.choice(FALLBACK_PROMPTS)
                    
                    return {"prompt": prompt}, 200
                except Exception as e:
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
            app.logger.error(f"Request exception when calling Writecream API: {str(e)}")
            prompt = random.choice(FALLBACK_PROMPTS)
            return {"prompt": prompt, "note": "Using fallback prompt due to API connectivity issues"}, 200
        except Exception as e:
            app.logger.error(f"Error in AI Prompt generation: {str(e)}")
            prompt = random.choice(FALLBACK_PROMPTS)
            return {"prompt": prompt, "note": "Using fallback prompt due to an error"}, 200




class CustomAiPromptResource(Resource):
    @jwt_required()
    def post(self):
        try:
            current_user_id = get_jwt_identity()
            
            # Get the request data
            request_data = request.get_json()
            if not request_data or 'customInput' not in request_data:
                return {"error": "Custom input is required"}, 400
                
            custom_input = request_data['customInput']
            
            
            api_key = os.getenv("api_key")
            tool_id = os.getenv("tool_id")
            api_url = os.getenv("api_url")
            

            if not api_key or not tool_id:
                app.logger.error("Writecream API configuration missing")
                return {"prompt": random.choice(FALLBACK_PROMPTS), 
                        "note": "Using fallback prompt due to missing API configuration"}, 200
            
            usage_file = "ai_prompt_usage.json"
            today = date.today().isoformat()
            
            try:
                if os.path.exists(usage_file):
                    with open(usage_file, "r") as f:
                        usage_data = json.load(f)
                else:
                    usage_data = {"date": today, "count": 0}
                    

                if usage_data["date"] != today:
                    usage_data = {"date": today, "count": 0}
                    

                if usage_data["count"] >= 45:
                    app.logger.warning("Daily API limit reached")
                    return {"prompt": random.choice(FALLBACK_PROMPTS),
                            "note": "Using fallback prompt due to daily limit reached"}, 200
                            

                usage_data["count"] += 1

                with open(usage_file, "w") as f:
                    json.dump(usage_data, f)
                    
            except Exception as e:
                app.logger.error(f"Error handling usage tracking: {str(e)}")

            
 
            tool_input = f"Give me a thought-provoking journaling prompt about {custom_input} that encourages deep reflection"
            
            app.logger.info(f"Making Writecream API request with custom input: {tool_input}")
            

            headers = {
                "Content-Type": "application/json"
            }
            
            payload = {
                "key": api_key,
                "tool_id": tool_id,
                "tool_input": tool_input
            }
            
            response = requests.post(
                api_url,
                headers=headers,
                json=payload,
                timeout=10  
            )
            

            if response.status_code == 200:
                prompt_data = response.json()
                app.logger.info(f"Received API response: {prompt_data}")
                
                try:
                    prompt = None
                    
                    if isinstance(prompt_data, str):
                        prompt = prompt_data.strip()
                    elif isinstance(prompt_data, dict):
                        if "output" in prompt_data:
                            prompt = prompt_data["output"].strip()
                        elif "result" in prompt_data:
                            prompt = prompt_data["result"].strip()
                        elif "prompt" in prompt_data:
                            prompt = prompt_data["prompt"].strip()
                        elif "content" in prompt_data:
                            prompt = prompt_data["content"].strip()
                        elif "text" in prompt_data:
                            prompt = prompt_data["text"].strip()
                        else:
                            prompt = str(prompt_data).strip()
                    else:
                        prompt = str(prompt_data).strip()
                    

                    if not prompt or len(prompt) < 10:
                        app.logger.warning("Received empty or very short prompt from API")
                        prompt = random.choice(FALLBACK_PROMPTS)
                    
                    if "what would you like to write about today" in prompt.lower():
                        app.logger.warning("Received default prompt from API, using fallback")
                        prompt = random.choice(FALLBACK_PROMPTS)
                    
                    return {"prompt": prompt}, 200
                except Exception as e:
                    app.logger.error(f"Error parsing API response: {str(e)}")
                    prompt = random.choice(FALLBACK_PROMPTS)
                    return {"prompt": prompt, "note": "Error parsing API response"}, 200
            else:
                #! If API call fails, use a fallback prompt
                app.logger.warning(f"API returned status code {response.status_code}")
                prompt = random.choice(FALLBACK_PROMPTS)
                return {"prompt": prompt, 
                        "note": f"Using fallback prompt due to API response: {response.status_code}"}, 200
                
        except requests.exceptions.RequestException as e:
            app.logger.error(f"Request exception when calling Writecream API: {str(e)}")
            prompt = random.choice(FALLBACK_PROMPTS)
            return {"prompt": prompt, "note": "Using fallback prompt due to API connectivity issues"}, 200
        except Exception as e:
            app.logger.error(f"Error in Custom AI Prompt generation: {str(e)}")
            prompt = random.choice(FALLBACK_PROMPTS)
            return {"prompt": prompt, "note": "Using fallback prompt due to an error"}, 200