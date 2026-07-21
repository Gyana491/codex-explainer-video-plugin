# Story and narration rules

Shared craft rules for turning a source into a truthful causal explainer. Used by `storyboard-director` and `create-explainer-video`.

## Source essence (`output/source-essence.json`)

- Read the complete source or input before outlining. Distill it into `source_essence` with `central_question`, `one_sentence_idea`, `audience`, `why_it_matters`, 3-5 `must_understand_points`, `supporting_evidence_or_examples`, `likely_misconception`, and `final_takeaway`.
- Preserve the source's meaning, evidence, qualifications, and causal relationships rather than its original order or wording. Remove tangents, repeated arguments, background that does not change understanding, and detail that cannot fit without overwhelming the audience.
- Never invent a fact, statistic, quote, example, or certainty the source does not support. Keep important uncertainty and limitations; flag a source conflict instead of smoothing it over.
- When the input is only a topic or short brief, build the same essence structure from the available information and clearly distinguish reasonable explanation from supplied facts.

## Story engine (`storyboard.json`: `story_engine`)

Build this before writing narration. Include `one_sentence_story`, `narrative_spine`, `audience_proxy`, `starting_state`, `goal`, `stakes`, `obstacle`, `turning_point`, `payoff`, `emotional_arc`, `visual_motif`, `open_loops`, and `callbacks`.

- Choose the simplest truthful `narrative_spine` that fits the material: `transformation`, `mystery_reveal`, `problem_solution`, `journey`, or `cause_effect`. Do not force every source into the same problem-solution template.
- Use an audience proxy as the recurring protagonist when it improves identification. For abstract, sensitive, historical, or highly technical topics, the proxy may be a neutral guide, representative object, system, or question instead of forced fiction.
- Define a concrete starting state, understandable goal, meaningful stakes, and the real obstacle to understanding or progress. Never fabricate danger, conflict, certainty, urgency, or a success story the source does not support.
- Place one turning point near the middle that changes how the audience interprets the problem, then make the payoff resolve the opening question and show the useful new understanding.
- Shape an honest emotional progression, such as `curiosity -> concern -> surprise -> clarity -> confidence`. Emotion must come from recognition, consequence, discovery, and relief, not clickbait or manipulation.
- Open only questions the explainer will answer. Record each `open_loop` with its setup scene and payoff scene, and close every loop before the ending.
- Choose one recurring visual motif, object, location, diagram, or character gesture that can return in later scenes with changed meaning. Record each callback with its setup and return scenes.

## Narration

- Build a clear story arc: relatable hook, goal and stakes, obstacle or misconception, rising questions, turning-point insight, mechanism, proof or example, payoff, and memorable takeaway.
- Apply a `but/therefore` test between scenes: the next scene should follow because the previous beat created a complication, question, consequence, or discovery. Rewrite sequences that are merely unrelated facts joined by "and then."
- Give every scene one primary story job: `setup`, `escalation`, `question`, `reveal`, `mechanism`, `proof`, `payoff`, or `reflection`. Avoid listicle-like middle sections.
- Use familiar situations and concrete stakes so the audience feels why the topic matters. Create resonance through recognition and clarity, not hype or manufactured drama.
- Explain one idea at a time in plain conversational language: short sentences, active voice, familiar words, concrete verbs. Assume no prior knowledge; define unavoidable jargon immediately in everyday language, then keep using the simpler term.
- Use an analogy only when it makes the mechanism easier to understand, and state the boundary when the analogy could mislead. Simplify without deleting a condition that changes the meaning.
- Write only spoken narration in the voiceover script; keep headings, scene labels, citations, and production directions outside it.
- Remove filler, repetition, throat-clearing, generic motivation, exaggerated claims, and unnecessary calls to action unless the user requests them.
- End with one concise takeaway the audience can repeat in their own words.
- **Cold-listener test:** a person who never saw the source must understand what the topic is, why it matters, how it works, and what to remember using the narration alone. Revise any line that requires the visuals or the original source to make sense.
- **Story-integrity test:** summarize the full arc in one sentence; confirm the opening question is answered; verify every open loop closes; remove or rewrite any scene whose absence would not break the causal logic, necessary evidence, or emotional progression.

## Slide craft

- Give every slide exactly one `clear_idea` a viewer can identify within two seconds.
- Make adjacent slides advance causally from setup and stakes through obstacle, discovery, mechanism, proof, and resolved outcome. Fill `cause_from_previous` for every scene after the first. Give each slide a distinct `composition_signature`; never reuse the same arrangement of title, character, objects, and diagram in multiple panels.
- Use `question_opened_or_answered`, `setup_or_payoff`, `emotional_shift`, and `visual_callback` to preserve suspense, closure, emotional progression, and visual continuity without sacrificing factual accuracy.
- Establish one original top-level `theme_bible` for all panels: named recurring character designs and wardrobe, chosen background treatment, line art, optional hatching, accent color, handwritten typography, spacing, container/decoration language, icon style, and shadow treatment. Repeat the character and theme anchors in every slide description.
- Make every final composited slide presentation-complete and understandable without narration: one `clear_idea`, a concise handwritten-style overlay title, only the labels and short annotations needed for that idea, at least one named recurring story character, and a visual explanation using the most appropriate arrows, paths, diagrams, process flows, charts, text, and objects.
- Structure `on_slide_text` as `title`, `object_labels`, `important_phrase`, `supporting_notes`, and `emphasis_marks`. For each object label record its target and whether it needs a thin pointer line.
- Keep copy concise and exact: title at most 7 words, labels 1-4 words, notes at most 6 words, no more than 24 supporting words total. Never invent extra copy or use narration as a paragraph on the slide.
- Place the title in a clean empty area, usually top-left. Place labels close to their objects and connect them with thin hand-drawn pointer lines only when proximity is insufficient.
- Keep text and important objects inside safe margins. Never place text over faces, hands, screens, detailed illustrations, panel dividers, or borders. Maintain generous whitespace around every text block.
- Use visual hierarchy that reveals the idea within two seconds: title first, main visual path second, accent-colored outcome or key phrase third, supporting notes last.
- Use the theme's accent color only for important words, arrows, outcomes, underlines, highlights, and occasional circles, boxes, or stars. Keep ordinary text in the theme's ink color and avoid overcrowding.
- Ask image generation to reserve the declared text and overlay zones and avoid essential lettering. Render exact copy, data, equations, and diagram relationships deterministically after panel extraction — never rely on generated lettering as the source of truth.
- Define a `caption_safe_area` for every slide, normally near the title-safe lower edge, free of faces, essential diagram details, and small on-slide text.
