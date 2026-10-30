"use client";

import { useState } from "react";
import type { QuizResponse } from "@/lib/rag-types";
import { Button } from "@/components/ui/button";
import { RichText } from "./rich-text";
import { cn } from "@/lib/utils";

export function PracticeSession({ result, format }: { result: QuizResponse; format: string }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [ratings, setRatings] = useState<Record<number, boolean>>({});
  const [queue, setQueue] = useState(() => result.items.map((_, i) => i));
  const [flipped, setFlipped] = useState(false);
  const [round, setRound] = useState(1);
  const flashcards = format === "flashcard";
  const completed = Object.keys(checked).length;
  const correct = result.items.filter((item, i) => checked[i] && (item.options ? answers[i] === item.answer : ratings[i])).length;
  const reset = () => { setAnswers({}); setChecked({}); setRatings({}); setQueue(result.items.map((_, i) => i)); setFlipped(false); setRound(1); };
  if (!result.items.length) return <p role="status" className="state-text">No supported questions could be created. Try a broader topic or another source.</p>;
  if (flashcards) {
    const index = queue[0];
    const item = result.items[index];
    const rate = (known: boolean) => {
      setRatings(current => ({ ...current, [index]: known }));
      setQueue(current => current.slice(1));
      setFlipped(false);
    };
    const missed = result.items.map((_, i) => i).filter(i => ratings[i] === false);
    return <section aria-label="Flashcard review">
      <div className="practice-toolbar"><p role="status">Round {round} ? {queue.length} remaining ? {Object.values(ratings).filter(Boolean).length} remembered</p><Button variant="ghost" onClick={reset}>Restart</Button></div>
      {item ? <>
        <button type="button" className="flashcard-face" aria-label={flipped ? "Show prompt" : "Flip card to reveal answer"} aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>
          <span className="state-text">{flipped ? "Answer" : "Prompt"}</span><span>{flipped ? item.answer : item.question}</span><span className="state-text">Click or press Space to flip</span>
        </button>
        {flipped && <div className="quiz-answer"><RichText evidence={result.evidence}>{item.explanation || item.answer}</RichText><p>Source [{item.citation_marker}]</p></div>}
        <div className="practice-toolbar"><Button variant="outline" disabled={!flipped} onClick={() => rate(false)}>Study again</Button><Button disabled={!flipped} onClick={() => rate(true)}>I remembered</Button></div>
      </> : <div className="practice-complete" role="status"><h3>Review complete</h3><p>{result.items.length - missed.length} of {result.items.length} cards remembered.</p>{missed.length > 0 && <Button onClick={() => { setQueue(missed); setRound(r => r + 1); }}>Review {missed.length} missed cards</Button>}</div>}
    </section>;
  }
  return <section aria-label="Practice questions">
    <div className="practice-toolbar"><p role="status">{completed} of {result.items.length} checked ? {correct} {format === "mcq" ? "correct" : "marked correct"}</p><Button variant="ghost" onClick={reset}>Retry set</Button></div>
    {result.items.map((item, i) => <article className="quiz-item" key={i}>
      <div className="quiz-question"><span>{i + 1}.</span><h3>{item.question}</h3></div>
      {item.options ? <div className="quiz-options" role="group" aria-label={`Question ${i + 1} choices`}>
        {item.options.map((option, j) => <button type="button" key={j} disabled={checked[i]} aria-pressed={answers[i] === option} onClick={() => setAnswers(a => ({ ...a, [i]: option }))} className={cn("quiz-option", answers[i] === option && "selected", checked[i] && option === item.answer && "correct", checked[i] && answers[i] === option && option !== item.answer && "incorrect")}><span>{String.fromCharCode(65 + j)}</span>{option}</button>)}
      </div> : <label className="practice-written">Your answer<textarea value={answers[i] || ""} disabled={checked[i]} rows={3} maxLength={4000} onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))} /></label>}
      {checked[i] && <div className="quiz-answer"><p>{item.options ? (answers[i] === item.answer ? "Correct" : "Keep practicing") : "Compare with the source answer"}</p><RichText evidence={result.evidence}>{item.answer + (item.explanation ? "\n\n" + item.explanation : "")}</RichText>
        {!item.options && <div className="practice-toolbar"><Button variant={ratings[i] === false ? "secondary" : "ghost"} onClick={() => setRatings(r => ({ ...r, [i]: false }))}>Needs practice</Button><Button variant={ratings[i] === true ? "secondary" : "ghost"} onClick={() => setRatings(r => ({ ...r, [i]: true }))}>I got it right</Button></div>}
      </div>}
      <div className="quiz-actions"><span>Source [{item.citation_marker}]</span><Button variant="outline" size="sm" disabled={checked[i] || !answers[i]?.trim()} onClick={() => setChecked(c => ({ ...c, [i]: true }))}>{checked[i] ? "Checked" : item.options ? "Check answer" : "Show source answer"}</Button></div>
    </article>)}
    {completed === result.items.length && <p role="status" className="practice-complete">Set complete. {correct} of {result.items.length} {format === "mcq" ? "correct" : "marked correct"}. Retry the set to practice again.</p>}
  </section>;
}
