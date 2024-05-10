import { useEffect, useReducer } from "react";
import Header from "./Header";
import Loader from "./Loader";
import Error from "./Error";

function reducer(state, action) {
  switch (action.type) {
    case "dataReceived":
      return { ...state, status: "ready", questions: action.payload };
    case "dataFailed":
      return { ...state, status: "error" };

    case "active":
      return { ...state, status: "active" };

    case "newAnswer":
      const question = state.questions.at(state.index);

      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      };

    case "nextQuestion":
      return { ...state, index: state.index++, answer: null };

    case "finish":
      return { ...state, status: "finished" };

    default:
      throw new Error("Action Unknown");
  }
}

export default function App() {
  const [{ questions, status, index, answer, points }, dispatch] = useReducer(
    reducer,
    {
      questions: [],
      status: "loading",
      index: 0,
      answer: null,
      points: 0,
    }
  );

  useEffect(() => {
    fetch(`http://localhost:9000/questions`)
      .then((res) => res.json())
      .then((data) => dispatch({ type: "dataReceived", payload: data }))
      .catch(() => dispatch({ type: "dataFailed" }));
  }, []);

  const totalPoints = questions
    .map((q) => q.points)
    .reduce((cur, acc) => cur + acc, 0);

  const numQuestions = questions.length;

  return (
    <div className="app">
      <Header />
      <Main>
        {status === "loading" && <Loader />}
        {status === "error" && <Error />}
        {status === "ready" && (
          <StarScreen numQuestions={numQuestions} dispatch={dispatch} />
        )}
        {status === "active" && (
          <>
            <Progress
              numQuestions={numQuestions}
              index={index}
              points={points}
              totalPoints={totalPoints}
              answer={answer}
            />
            <Questions
              question={questions.at(index)}
              dispatch={dispatch}
              answer={answer}
            />
            <NextButton answer={answer} dispatch={dispatch} />
          </>
        )}

        {status === "finished" && (
          <FinishScreen totalPoints={totalPoints} points={points} />
        )}
      </Main>
    </div>
  );
}

function FinishScreen({ points, totalPoints }) {
  const perc = (points / totalPoints) * 100;
  return (
    <p className="result">
      You scored <strong>{points}</strong> out of {totalPoints} (
      {Math.ceil(perc)}%)
    </p>
  );
}

function Progress({ answer, index, numQuestions, points, totalPoints }) {
  return (
    <header className="progress">
      <progress max={numQuestions} value={index + +(answer !== null)} />
      <p>
        Questio <strong>{index + 1}</strong> / {numQuestions}
      </p>

      <p>
        {points} / {totalPoints}
      </p>
    </header>
  );
}

function NextButton({ dispatch, answer, index, numQuestions }) {
  if (answer === null) return null;

  if (index < numQuestions - 1)
    return (
      <div>
        (
        <button
          className="btn btn-ui"
          onClick={() => dispatch({ type: "nextQuestion" })}
        >
          Next
        </button>
        )
      </div>
    );

  if (index === numQuestions - 1)
    return (
      <div>
        (
        <button
          className="btn btn-ui"
          onClick={() => dispatch({ type: "finish" })}
        >
          finished
        </button>
        )
      </div>
    );
}

function Questions({ question, dispatch, answer }) {
  return (
    <div>
      <h4>{question.question}</h4>
      <Options question={question} dispatch={dispatch} answer={answer} />
    </div>
  );
}

function Options({ question, dispatch, answer }) {
  const ca = question.correctOption === answer;
  return (
    <div className="options">
      {question.options.map((option, i) => (
        <button
          onClick={() => dispatch({ type: "newAnser", payload: i })}
          key={i}
          disabled={answer !== null}
          className={`btn btn-option ${answer === i ? "answer" : ""}${
            answer !== null ? (ca ? "correct" : "wrong") : ""
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function StarScreen({ numQuestions, dispatch }) {
  return (
    <div className="start">
      <h2>Welcome to The React Quiz!</h2>
      <h3>{numQuestions} questions to test your React mastery.</h3>
      <button
        onClick={() => dispatch({ type: "active" })}
        className="btn btn-ui"
      >
        Let's start
      </button>
    </div>
  );
}
