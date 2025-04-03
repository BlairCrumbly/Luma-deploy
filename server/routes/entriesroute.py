from config import db, api
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Entry, Journal

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
            pass
        except Exception as e:
            pass 

