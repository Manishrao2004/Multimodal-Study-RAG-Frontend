"use client";

import type { AskResponse, EvidenceQuote } from "@/lib/rag-types";

const statusLabels = {
  supported: "Supported by sources",
  partial: "Partly supported",
  missing: "Support not established",
  conflicting: "Sources disagree",
  not_checked: "Not assessed",
};

export function AnswerCoverage({
  result,
  onCitationClick,
}: {
  result: AskResponse;
  onCitationClick: (marker: number) => void;
}) {
  const aspects = result.evidence_map ?? [];
  const verification = result.claim_verification;
  const quoteView = (quote: EvidenceQuote, index: number) => {
    const marker = result.evidence.findIndex(
      (item) => item.chunk.chunk_id === quote.chunk_id,
    ) + 1;
    return (
      <blockquote key={`${quote.chunk_id}-${index}`} className="coverage-quote">
        <p>{quote.quote}</p>
        {marker > 0 && (
          <button type="button" onClick={() => onCitationClick(marker)}>
            Inspect source [{marker}]
          </button>
        )}
      </blockquote>
    );
  };
  return (
    <>
      {aspects.length > 0 && (
        <details className="answer-coverage">
          <summary>Coverage of your question</summary>
          <p className="coverage-note">
            Support was assessed against the retrieved material. A missing part may
            still exist elsewhere in your sources.
          </p>
          <ul className="coverage-list">
            {aspects.map((aspect) => (
              <li key={aspect.aspect_id}>
                <div className="coverage-row">
                  <span>{aspect.aspect}</span>
                  <span className={`coverage-status ${aspect.status}`}>
                    {statusLabels[aspect.status]}
                  </span>
                </div>
                {aspect.reason && <p className="coverage-note">{aspect.reason}</p>}
                {[...aspect.supports, ...aspect.conflicts].map(quoteView)}
              </li>
            ))}
          </ul>
        </details>
      )}
      {verification && verification.status !== "not_checked" && (
        <details className="answer-coverage">
          <summary>
            {verification.fallback_kind === "supported_claims"
              ? "Some source content was omitted"
              : verification.fallback_used
              ? "Why source excerpts are shown"
              : verification.withheld ? "Source answer withheld" : "Source-claim check"}
          </summary>
          <p className="coverage-note">{verification.reason}</p>
          <p className="coverage-note">
            This model-assisted check can miss errors. General-knowledge
            explanations were not verified.
          </p>
          {verification.repair_attempted && (
            <p className="coverage-note">
              The source draft was revised once and checked again.
            </p>
          )}
          {verification.claims.length > 0 && (
            <ul className="coverage-list">
              {verification.claims.map((claim) => (
                <li key={claim.claim_id}>
                  <p>{claim.text}</p>
                  <p className="coverage-note">
                    {claim.status === "supported"
                      ? "Support established by the check"
                      : claim.status === "not_checked"
                        ? "Classified as nonfactual text"
                        : "Support was not established"}
                    {claim.provenance === "derived" ? " · Derived from source facts" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </>
  );
}
