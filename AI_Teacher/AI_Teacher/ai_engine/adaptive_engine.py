def decide_next_action(score, result, misconception=""):
    """
    Decide how the AI teacher should continue teaching
    based on the student's performance.
    """

    result = result.upper()

    # Student understands the concept
    if result == "CORRECT" and score >= 80:
        return {
            "action": "INCREASE_DIFFICULTY",
            "message": "The student understands the concept. Move to a harder question.",
            "difficulty": "Hard"
        }

    # Student partially understands
    elif result == "CORRECT" and score >= 60:
        return {
            "action": "PRACTICE",
            "message": "The student has basic understanding. Give another practice question.",
            "difficulty": "Medium"
        }

    # Student is struggling
    elif result == "INCORRECT":
        return {
            "action": "RETEACH",
            "message": "The student has a misconception. Explain the concept again using a simpler example.",
            "difficulty": "Easy",
            "misconception": misconception
        }

    # Default
    else:
        return {
            "action": "SIMPLIFY",
            "message": "Simplify the explanation and provide another example.",
            "difficulty": "Easy"
        }


if __name__ == "__main__":

    # Test case: student gives a wrong answer
    result = decide_next_action(
        score=0,
        result="INCORRECT",
        misconception="Student thinks acceleration increases when mass increases."
    )

    print("\n========== ADAPTIVE ENGINE ==========\n")

    print("Action:", result["action"])
    print("Message:", result["message"])
    print("Next Difficulty:", result["difficulty"])

    if "misconception" in result:
        print("Misconception:", result["misconception"])