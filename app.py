from flask import Flask, jsonify, send_from_directory
import os
import random

app = Flask(__name__)
MUSIC_DIR = "/myself/music"

def get_songs():
    return [f for f in os.listdir(MUSIC_DIR) if f.endswith(('.mp3', '.ogg', '.wav'))]

@app.route('/api/random-song')
def random_song():
    songs = get_songs()
    if not songs:
        return jsonify({"error": "Нет треков"}), 404
    
    track = random.choice(songs)
    return jsonify({
        "title": os.path.splitext(track)[0],
        "url": f"/api/music/{track}"  # Проксируется через Nginx
    })

@app.route('/api/music/<path:filename>')
def serve_music(filename):
    return send_from_directory(MUSIC_DIR, filename)

if __name__ == '__main__':
    app.run(port=5000)