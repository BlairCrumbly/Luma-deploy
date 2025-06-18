from config import db, api
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Journal
import traceback

class JournalsResource(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            print(f"Current user ID: {current_user_id}")  # Debug log
            
            journals = Journal.query.filter_by(user_id=current_user_id).all()
            if not journals:
                return {"message": 'no journals found'}, 404
            
            return [journal.to_dict() for journal in journals], 200
        except Exception as e:
            print(f"Error in GET journals: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return {'error': f'An error occurred while fetching journals: {str(e)}'}, 500
        
    @jwt_required()
    def post(self):
        try:
            # Debug logging
            print("POST /journals called")
            
            current_user_id = get_jwt_identity()
            print(f"Current user ID: {current_user_id}")
            
            data = request.get_json()
            print(f"Request data: {data}")

            # Extra validation
            title = data.get('title')
            year = data.get('year')
            color = data.get('color', '#E7E5E5')

            print(f"Parsed data - Title: {title}, Year: {year}, Color: {color}")

            if not title or not year:
                return {"error": "Title and year are required"}, 400
            
            new_journal = Journal(
                title=title,
                year=year,
                color=color,
                user_id=current_user_id
            )
            
            print(f"Created journal object: {new_journal}")
            
            db.session.add(new_journal)
            db.session.commit()
            
            print("Journal saved successfully")
            return new_journal.to_dict(), 201
        
        except ValueError as ve:
            print(f"ValueError: {str(ve)}")
            return {'error': str(ve)}, 400

        except Exception as e:
            print(f"Exception in POST journals: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return {'error': f'Error creating Journal: {str(e)}'}, 500

class JournalResource(Resource):
    @jwt_required()
    def get(self, journal_id):
        try:
            current_user_id = get_jwt_identity()
            journal = Journal.query.filter_by(id=journal_id, user_id=current_user_id).first()
            
            if not journal:
                return {"error": "Journal not found"}, 404
            
            return journal.to_dict(), 200
        except Exception as e:
            print(f"Error in GET journal: {str(e)}")
            return {'error': f'An error occurred while fetching the journal: {str(e)}'}, 500
    
    @jwt_required()
    def put(self, journal_id):
        try:
            current_user_id = get_jwt_identity()
            journal = Journal.query.filter_by(id=journal_id, user_id=current_user_id).first()
            
            if not journal:
                return {"error": "Journal not found"}, 404
            
            data = request.get_json()
            
            # Update fields if they exist in the request
            if 'title' in data:
                journal.title = data['title']
            if 'year' in data:
                journal.year = data['year']
            if 'color' in data:
                journal.color = data['color']
            
            db.session.commit()
            return journal.to_dict(), 200
        
        except Exception as e:
            print(f"Error in PUT journal: {str(e)}")
            return {'error': f'Error updating journal: {str(e)}'}, 500
    
    @jwt_required()
    def delete(self, journal_id):
        try:
            current_user_id = get_jwt_identity()
            journal = Journal.query.filter_by(id=journal_id, user_id=current_user_id).first()
            
            if not journal:
                return {"error": "Journal not found"}, 404
            
            db.session.delete(journal)
            db.session.commit()
            
            return {"message": "Journal deleted successfully"}, 200
        
        except Exception as e:
            print(f"Error in DELETE journal: {str(e)}")
            return {'error': f'Error deleting journal: {str(e)}'}, 500