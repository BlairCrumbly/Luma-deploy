from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Journal, db

class JorunalsResource(Resource):
    def get(self):
        try:
            pass
        except Exception as e:
            pass

