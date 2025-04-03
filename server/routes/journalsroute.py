from config import db, api
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Journal

class JorunalsResource(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            journals = Journal.query.filter_by(user_id=current_user_id).all()
            if not journals:
                return {"message":'no journals found'}, 404
            
            return [journals.to_dict() for journal in journals], 200
        except Exception as e:
            return {'error:' f'An error occurred while fetching journals: {str(e)}', 500}
        
    def post(self):
        try:
            data = request.get_json()
            
        except Exception as e:
            return {'error': f'Error creating Journal: {str(e)}'}, 500


api.add_resource(JorunalsResource, '/journals')