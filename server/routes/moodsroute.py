from config import db, api
from flask import request
from flask_restful import Resource
from models import Mood

class MoodsResource(Resource):
    def get(self):
        try:
            moods = Mood.query.all()
            return [mood.to_dict() for mood in moods], 200
        except Exception as e:
            return {"error": f"An error occurred while fetching moods: {str(e)}"}, 500