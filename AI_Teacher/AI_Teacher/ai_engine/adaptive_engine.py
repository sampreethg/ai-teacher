def decide_next_action(score, result, misconception=""):
    """
    Decide how the AI teacher should continue teaching
    based on the student's performance.
    Guarantees that evaluation errors never alter student difficulty or mastery.
    """
    if not result:
        result = "EVALUATION_ERROR"

    norm_result = str(result).upper().strip()

    # CRITICAL PROTECTION: Do not update difficulty or mastery on evaluation failures
    if norm_result in ["EVALUATION_ERROR", "ERROR"] or score is None:
        return {
            "action": "RETRY",
            "message": "Evaluation could not be completed. Student mastery and difficulty remain unchanged.",
            "difficulty": None,
            "misconception": ""
        }

    # Student understands the concept
    if norm_result == "CORRECT":
        numeric_score = int(score) if score is not None else 80
        if numeric_score >= 80:
            return {
                "action": "INCREASE_DIFFICULTY",
                "message": "The student understands the concept. Move to a harder question.",
                "difficulty": "Hard"
            }
        else:
            return {
                "action": "PRACTICE",
                "message": "The student has basic understanding. Give another practice question.",
                "difficulty": "Medium"
            }

    # Partial understanding
    elif norm_result == "PARTIAL":
        return {
            "action": "PRACTICE",
            "message": "The student demonstrates partial understanding. Provide targeted practice.",
            "difficulty": "Medium"
        }

    # Student has misconception / incorrect answer
    elif norm_result == "INCORRECT":
        return {
            "action": "RETEACH",
            "message": "The student has a misconception. Explain the concept again using a simpler example.",
            "difficulty": "Easy",
            "misconception": misconception or ""
        }

    # Fallback for unrecognized valid status
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