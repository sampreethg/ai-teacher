import os
import sys
import json
import urllib.request
import urllib.error

# Ensure AI_Teacher directory is on sys.path for direct unit tests
ai_teacher_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "AI_Teacher", "AI_Teacher"))
if ai_teacher_path not in sys.path:
    sys.path.insert(0, ai_teacher_path)

from ai_engine.answer_evaluator import evaluate_answer
from ai_engine.adaptive_engine import decide_next_action
from ai_engine.question_generator import generate_questions, validate_question_data

def run_suite():
    print("==================================================")
    print("STARTING CLASSROOM & EVALUATION VERIFICATION SUITE")
    print("==================================================")

    passed_count = 0
    total_count = 0

    def assert_true(condition, description):
        nonlocal passed_count, total_count
        total_count += 1
        if condition:
            print(f" [PASS] {description}")
            passed_count += 1
        else:
            print(f" [FAIL] {description}")
            raise AssertionError(f"Test assertion failed: {description}")

    # ----------------------------------------------------
    # TEST 1: FRONTEND NEXT.JS ACCESSIBILITY & JOIN CLASS
    # ----------------------------------------------------
    print("\n--- Test 1: Frontend Next.js Server & Join Class Navigation ---")
    try:
        req = urllib.request.Request("http://localhost:3000/")
        with urllib.request.urlopen(req, timeout=45) as res:
            home_html = res.read().decode('utf-8')
            assert_true(res.status == 200, "Home page (/) returned HTTP 200")
            assert_true("Join Class" in home_html or "join-class" in home_html, "Home page contains 'Join Class' button")
    except Exception as e:
        print(f" [FAIL] Home page check failed: {e}")
        raise

    try:
        req = urllib.request.Request("http://localhost:3000/classroom")
        with urllib.request.urlopen(req, timeout=45) as res:
            classroom_html = res.read().decode('utf-8')
            assert_true(res.status == 200, "Classroom page (/classroom) returned HTTP 200")
    except Exception as e:
        print(f" [FAIL] Classroom page check failed: {e}")
        raise

    # ----------------------------------------------------
    # TEST 2: LESSON GENERATION (VIDEO SOURCE OF TRUTH)
    # ----------------------------------------------------
    print("\n--- Test 2: Lesson Generation via FastAPI ---")
    lesson_req_data = json.dumps({
        "topic": "Newton's Second Law",
        "level": "Beginner",
        "duration": 5,
        "language": "English",
        "style": "Conceptual"
    }).encode('utf-8')
    lesson_req = urllib.request.Request(
        "http://localhost:8000/api/lesson",
        data=lesson_req_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(lesson_req, timeout=30) as res:
        lesson_resp = json.loads(res.read().decode('utf-8'))
        assert_true("lesson" in lesson_resp, "Lesson endpoint returned 'lesson' property")
        lesson_text = lesson_resp["lesson"]
        assert_true(len(lesson_text) > 50, f"Lesson content length is substantive ({len(lesson_text)} chars)")
        print(f"   Sample lesson text: {lesson_text[:80]}...")

    # ----------------------------------------------------
    # TEST 3: QUIZ GENERATION GROUNDED IN LESSON CONTENT & VALIDATION
    # ----------------------------------------------------
    print("\n--- Test 3: Quiz Generation Grounded in Lesson Content (Section 8 Validation) ---")
    q_req_data = json.dumps({
        "topic": "Newton's Second Law",
        "lesson": lesson_text,
        "level": "Beginner",
        "difficulty": "Easy",
        "number_of_questions": 1
    }).encode('utf-8')
    q_req = urllib.request.Request(
        "http://localhost:8000/api/question",
        data=q_req_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(q_req, timeout=60) as res:
        q_resp = json.loads(res.read().decode('utf-8'))
        assert_true(q_resp.get("status") == "success", "Quiz generation status is 'success'")
        assert_true(len(q_resp.get("questions", [])) == 1, "Exactly 1 validated question returned")
        question = q_resp["questions"][0]
        
        # Verify strict Section 8 validations
        assert_true(bool(question.get("question")), "Question text exists and non-empty")
        assert_true("options" in question, "Options object exists")
        options = question["options"]
        assert_true(set(options.keys()) == {"A", "B", "C", "D"}, "Options has exactly keys A, B, C, D")
        assert_true(len(set(options.values())) == 4, "All 4 options are distinct (no duplicates)")
        assert_true(question.get("correct_answer") in ["A", "B", "C", "D"], f"Correct answer is valid option key: {question.get('correct_answer')}")
        assert_true(question.get("difficulty") in ["Easy", "Medium", "Hard"], f"Difficulty has allowed value: {question.get('difficulty')}")
        print(f"   Generated Question: {question['question']}")
        print(f"   Correct Answer: [{question['correct_answer']}] {options[question['correct_answer']]}")

    # ----------------------------------------------------
    # TEST 4: EVALUATION OF CORRECT ANSWER (FIX ROOT CAUSE OF 0% BUG)
    # ----------------------------------------------------
    print("\n--- Test 4: Evaluation of Correct Answer via /api/teach ---")
    correct_opt_key = question["correct_answer"]
    correct_answer_text = options[correct_opt_key]
    
    teach_req_data = json.dumps({
        "topic": "Newton's Second Law",
        "level": "Beginner",
        "question": question["question"],
        "correct_answer": correct_answer_text,
        "student_answer": correct_answer_text,
        "lesson": lesson_text
    }).encode('utf-8')
    teach_req = urllib.request.Request(
        "http://localhost:8000/api/teach",
        data=teach_req_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(teach_req, timeout=60) as res:
        teach_resp = json.loads(res.read().decode('utf-8'))
        assert_true(teach_resp.get("status") == "success", "/api/teach status is 'success'")
        eval_result = teach_resp.get("evaluation", {})
        assert_true(eval_result.get("result") == "CORRECT", f"Result is CORRECT (actual: {eval_result.get('result')})")
        assert_true(eval_result.get("score") is not None and eval_result.get("score") >= 80, f"Score is valid and >= 80% (actual: {eval_result.get('score')}%)")
        assert_true(eval_result.get("score") != 0, "Score is NOT 0% for correct answer!")
        
        # Check adaptive decision
        adapt_res = teach_resp.get("adaptive_decision", {})
        assert_true(adapt_res.get("action") in ["INCREASE_DIFFICULTY", "PRACTICE", "ADVANCE"], f"Adaptive engine action is valid: {adapt_res.get('action')}")
        print(f"   Evaluation Result: {eval_result.get('result')}, Score: {eval_result.get('score')}%")
        print(f"   Explanation: {eval_result.get('explanation')}")

    # ----------------------------------------------------
    # TEST 5: SIMULATED EVALUATOR FAILURE (PROTECT ADAPTIVE ENGINE & SCORE != 0)
    # ----------------------------------------------------
    print("\n--- Test 5: Simulated Evaluator Failure Protection ---")
    import unittest.mock
    from ai_engine import answer_evaluator
    # Directly simulate an evaluator exception (e.g. API crash, quota exhaustion, network down)
    with unittest.mock.patch.object(answer_evaluator.client.models, 'generate_content', side_effect=Exception("Simulated 500 API Crash / Timeout")):
        bad_eval = answer_evaluator.evaluate_answer(
            question="What does F mean?",
            correct_answer="Force",
            student_answer="Force",
            lesson="F = m * a"
        )
    assert_true(bad_eval.get("result") == "EVALUATION_ERROR", f"Evaluator failure returned result: {bad_eval.get('result')}")
    assert_true(bad_eval.get("score") is None, f"Evaluator failure score is None (NOT 0%): {bad_eval.get('score')}")
    assert_true(bad_eval.get("result") != "INCORRECT", "Evaluator failure is NOT marked INCORRECT")

    # Feed this EVALUATION_ERROR into the adaptive engine and verify mastery/difficulty is untouched
    adapt_decision = decide_next_action(
        score=bad_eval.get("score"),
        result=bad_eval.get("result"),
        misconception="some text"
    )
    assert_true(adapt_decision.get("action") == "RETRY", f"Adaptive action on EVALUATION_ERROR is 'RETRY': {adapt_decision.get('action')}")
    assert_true(adapt_decision.get("difficulty") is None, "Student difficulty is NOT altered on EVALUATION_ERROR (difficulty is None)")
    print("   Protected Adaptive State: action=RETRY, difficulty=None (Unchanged).")

    # ----------------------------------------------------
    # TEST 6: QUIZ GENERATION VALIDATION FAILURE HANDLING
    # ----------------------------------------------------
    print("\n--- Test 6: Quiz Generation Malformed Output Rejection (Section 8) ---")
    
    def rejects(data, desc):
        try:
            validate_question_data(data)
            assert_true(False, f"Should have rejected: {desc}")
        except (ValueError, TypeError, KeyError) as e:
            assert_true(True, f"Validator successfully rejected {desc} ({e})")

    # Test validator with invalid question structures
    rejects({
        "question": "",
        "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
        "correct_answer": "A",
        "difficulty": "Easy"
    }, "empty question text")

    rejects({
        "question": "What is acceleration?",
        "options": {"A": "1", "B": "1", "C": "2", "D": "3"},
        "correct_answer": "A",
        "difficulty": "Easy"
    }, "duplicate options")

    rejects({
        "question": "What is acceleration?",
        "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
        "correct_answer": "Z",
        "difficulty": "Easy"
    }, "correct_answer not in options")

    rejects({
        "question": "What is acceleration?",
        "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
        "correct_answer": "A",
        "difficulty": "Impossible"
    }, "invalid difficulty value")

    print("\n==================================================")
    print(f"ALL {passed_count}/{total_count} INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_suite()
