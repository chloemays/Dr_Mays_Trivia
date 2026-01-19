"""Refine game questions by filtering and adding content.

Removes movie-related questions and adds musical theater content.
"""

import json
import os

SOURCE_FILE = 'gameConfigBackupDO-NOT-TOUCH.json'
TARGET_FILE = 'gameConfig.json'

def main():
    """Process the game configuration to refine categories."""
    if not os.path.exists(SOURCE_FILE):
        print(f"Error: Source file {SOURCE_FILE} not found.")
        return

    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Filter categories
    new_categories = []
    removed_movie_count = 0
    
    for category in data['categories']:
        # Remove Movies category completely
        if category['id'] == 'movies' or category['name'] == 'Movies':
            print(f"Removing entire category: {category['name']}")
            continue

        # Filter questions within categories
        new_questions = []
        for q in category['questions']:
            text = q['text'].lower()
            
            # Explicitly KEEP the Phantom movie question as requested
            if q['id'] == 'musicals_24':
                new_questions.append(q)
                continue

            # Remove other movie/superhero references if they slip into other categories
            # "Iron Man" is specifically targeted
            if 'iron man' in text or 'tony stark' in text:
                print(f"Removing specific question: {q['id']} - {q['text']}")
                continue
            
            new_questions.append(q)
        
        category['questions'] = new_questions
        new_categories.append(category)

    data['categories'] = new_categories

    # Add new Musical Theater Questions to 'musicals' category
    musicals_cat = next((c for c in data['categories'] if c['id'] == 'musicals'), None)
    if musicals_cat:
        new_q_start_id = 900 # Start high to avoid collision
        new_questions_data = [
            {
                "text": "Who wrote the music and lyrics for 'Hamilton'?",
                "answers": ["Lin-Manuel Miranda", "Andrew Lloyd Webber", "Stephen Sondheim", "Jonathan Larson"],
                "correctIndex": 0,
                "storyProgression": "You didn't throw away your shot!"
            },
            {
                "text": "The musical 'Wicked' tells the story of which character from Oz?",
                "answers": ["The Wicked Witch of the West", "Glinda the Good", "Dorothy", "The Wizard"],
                "correctIndex": 0,
                "storyProgression": "Defying gravity!"
            },
            {
                 "text": "Who is the main protagonist in 'Les Misérables'?",
                 "answers": ["Jean Valjean", "Javert", "Marius", "Cosette"],
                 "correctIndex": 0,
                 "storyProgression": "To love another person is to see the face of God!"
            },
            {
                "text": "Which rock musical is based on the opera 'La Bohème'?",
                "answers": ["Rent", "Hair", "Tommy", "Jesus Christ Superstar"],
                "correctIndex": 0,
                "storyProgression": "Measure your life in love!"
            },
            {
                "text": "In 'The Sound of Music', which song does Maria teach the children?",
                "answers": ["Do-Re-Mi", "Edelweiss", "Climb Ev'ry Mountain", "Sixteen Going on Seventeen"],
                "correctIndex": 0,
                "storyProgression": "Do, a deer, a female deer!"
            },
            {
                "text": "Which musical features the song 'The Circle of Life'?",
                "answers": ["The Lion King", "Aladdin", "Frozen", "Beauty and the Beast"],
                "correctIndex": 0,
                "storyProgression": "It moves us all!"
            },
             {
                "text": "What is the longest-running show in Broadway history?",
                "answers": ["The Phantom of the Opera", "Chicago", "The Lion King", "Cats"],
                "correctIndex": 0,
                "storyProgression": "The music of the night!"
            },
            {
                "text": "Which musical is set during the French Revolution?",
                "answers": ["Les Misérables", "Hamilton", "Miss Saigon", "Evita"],
                "correctIndex": 0,
                "storyProgression": "Do you hear the people sing?"
            }
        ]

        for i, item in enumerate(new_questions_data):
             q = {
                "id": f"musicals_new_{new_q_start_id + i}",
                "enabled": True,
                "status": "complete",
                "text": item['text'],
                "answers": item['answers'],
                "correctIndex": item['correctIndex'],
                "storyProgression": item['storyProgression'],
                "media": {"image": None, "audio": None, "video": None},
                "requiredMedia": {"image": {"needed": False, "description": None}},
                "progressionImage": None,
                "author": "AI",
                "dateCreated": "2026-01-19"
            }
             musicals_cat['questions'].append(q)
        print(f"Added {len(new_questions_data)} new Musical Theater questions.")
    else:
        print("Warning: 'musicals' category not found.")

    with open(TARGET_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    print(f"Successfully created {TARGET_FILE} with refined categories.")

if __name__ == "__main__":
    main()
