# Evidence Desk

An evidence-review application for AI-generated answers. A reviewer inspects exact passages, sees why a citation failed and signs individual claims before release.

**[Launch the interactive case](https://dangerous37.github.io/evidence-desk/)** · [Input and decision contract](CONTRACT.md)

## Reproduce the decision
Sign off both passages to release the sample answer. Revise its source and observe both approvals become unusable. Withdraw the source and inspect the blocked claims. Open the JSON editor to review a different answer.

## Run the local API
Use Node.js 24. Run `npm ci --offline`, `npm test` and `npm start`. Open the address printed by the server. POST JSON to `/api/evaluate` for the same result as the UI. The local web client calls the HTTP API. The public static site runs the same decision module in the browser. All examples use synthetic data. Export a report from the client to keep the result.

To reproduce the browser test, use Python 3.12, install `requirements-test.txt`, run `python -m playwright install chrome`, then `python browser_test.py`.

## Operational limits
Verification establishes quote provenance. Semantic agreement is the reviewer's decision. Sample answers are authored fixtures; there is no LLM call. Sign-off is an in-session review marker, not authenticated identity.

## Resumen en español
Revisa respuestas de IA cita por cita. Una aprobación depende de la afirmación, la revisión y el contenido exacto de la fuente. Si cambia la evidencia, la respuesta vuelve a revisión.
