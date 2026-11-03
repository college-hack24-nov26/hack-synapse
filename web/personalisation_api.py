from flask import jsonify, request
from engine.glove_personalisation import GlovePersonalisation, PersonalisationError


def register_personalisation_routes(app, pipeline, database):
    service = GlovePersonalisation(pipeline, database)

    @app.route('/api/glove-personalisation/<action>', methods=['POST'])
    def glove_personalisation(action):
        data = request.get_json(silent=True) or {}
        try:
            if action == 'start':
                result = service.start()
            elif action == 'capture':
                result = service.capture(data.get('id'), data.get('pose'))
            elif action == 'cancel':
                result = service.cancel(data.get('id'))
            else:
                return jsonify(error='Unknown setup action.'), 404
            return jsonify(result)
        except PersonalisationError as error:
            return jsonify(error=str(error), fingers=error.fingers), error.status
