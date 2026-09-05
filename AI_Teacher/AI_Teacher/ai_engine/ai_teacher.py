from lesson_generator import generate_lesson
from question_generator import generate_questions
from answer_evaluator import evaluate_answer
from adaptive_engine import decide_next_action


def ask_question(q, lesson, topic, level):

    question = q["question"]
    options = q["options"]
    correct_answer = q["correct_answer"]

    print("\n================================")
    print("             QUESTION")
    print("================================\n")

    print(question)
    print()

    for letter, option in options.items():
        print(f"{letter}. {option}")

    student_answer = input(
        "\n👨‍🎓 Enter your answer (A/B/C/D): "
    ).strip().upper()

    print("\n========== EVALUATING ANSWER ==========\n")

    evaluation = evaluate_answer(
        question=question,
        correct_answer=correct_answer,
        student_answer=student_answer,
        lesson=lesson
    )

    print("Result:", evaluation["result"])
    print("Score:", evaluation["score"])
    print("Explanation:", evaluation["explanation"])

    if evaluation["misconception"]:
        print("Misconception:", evaluation["misconception"])

    print("\n========== ADAPTIVE DECISION ==========\n")

    adaptive_result = decide_next_action(
        score=evaluation["score"],
        result=evaluation["result"],
        misconception=evaluation["misconception"]
    )

    print("Action:", adaptive_result["action"])
    print("Message:", adaptive_result["message"])
    print("Next Difficulty:", adaptive_result["difficulty"])

    return evaluation, adaptive_result


def run_ai_teacher():

    print("\n================================")
    print("       AI TEACHER STARTED")
    print("================================\n")

    topic = "Newton's Second Law"
    level = "Beginner"
    language = "English"
    duration = 5
    style = "Real-world examples"

    # -----------------------------
    # 1. GENERATE LESSON
    # -----------------------------

    print("📚 Generating lesson...\n")

    lesson = generate_lesson(
        topic=topic,
        level=level,
        language=language,
        duration=duration,
        style=style
    )

    print("✅ Lesson generated.")

    # -----------------------------
    # 2. INITIAL QUESTIONS
    # -----------------------------

    print("\n❓ Generating questions...\n")

    question_data = generate_questions(
        topic=topic,
        lesson=lesson,
        level=level,
        difficulty="Easy",
        number_of_questions=3
    )

    questions = question_data["questions"]

    print("✅ Questions generated.")

    # -----------------------------
    # 3. ADAPTIVE LEARNING LOOP
    # -----------------------------

    for index, q in enumerate(questions, start=1):

        print(f"\n\n######## QUESTION {index} ########")

        evaluation, adaptive_result = ask_question(
            q,
            lesson,
            topic,
            level
        )

        # -----------------------------
        # RETEACH
        # -----------------------------

        if adaptive_result["action"] == "RETEACH":

            print("\n📚 AI TEACHER: Let's review this concept.\n")

            print(evaluation["explanation"])

            print("\n🔄 Generating an easier question...\n")

            easier_questions = generate_questions(
                topic=topic,
                lesson=lesson,
                level=level,
                difficulty="Easy",
                number_of_questions=1
            )

            easier_question = easier_questions["questions"][0]

            print("\n========== RETEACH QUESTION ==========\n")

            new_evaluation, new_adaptive_result = ask_question(
                easier_question,
                lesson,
                topic,
                level
            )

            if new_evaluation["result"] == "CORRECT":

                print(
                    "\n✅ Great! You understood the concept "
                    "after re-teaching."
                )

            else:

                print(
                    "\n⚠️ The concept still needs more practice."
                )

        # -----------------------------
        # CORRECT ANSWER
        # -----------------------------

        elif adaptive_result["action"] == "INCREASE_DIFFICULTY":

            print(
                "\n🔥 Excellent! Increasing difficulty "
                "for the next question."
            )

        # -----------------------------
        # PRACTICE
        # -----------------------------

        elif adaptive_result["action"] == "PRACTICE":

            print(
                "\n📝 Let's practice this concept a little more."
            )

        else:

            print(
                "\n➡️ Continuing to the next concept."
            )

    # -----------------------------
    # 4. COMPLETE
    # -----------------------------

    print("\n================================")
    print("       LESSON COMPLETED")
    print("================================")

    print("\n🎉 Good job! You completed the lesson.")


if __name__ == "__main__":
    run_ai_teacher()