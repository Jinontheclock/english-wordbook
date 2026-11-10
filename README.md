# English wordbook

A minimal, dark, fixed-viewport wordbook based on the supplied textbook photographs (pages 10–159). Each section scrolls within the fixed content area; questions and printed answers are presented individually. Open-ended exercises save responses locally. The URL records the current unit, section, question, answer, and page for browser history and direct links.

The source material was transcribed with OCR and selected manual corrections. Further proofreading against the photos is needed. No build step is required; GitHub Pages serves the repository root.

Korean glosses are supplemental study notes, written to match the textbook context with dictionary reference checks. They can be toggled per vocabulary item. The printed English text is retained. Reference searches covered Cambridge Dictionary, Collins, and Merriam-Webster; not every search returned a matching entry. Example references:
- https://dictionary.cambridge.org/dictionary/english/under-no-illusion
- https://www.collinsdictionary.com/us/dictionary/english/keener
- https://dictionary.cambridge.org/dictionary/english/put-money-where-mouth-is
- https://dictionary.cambridge.org/dictionary/english/clean-bill-of-health

Progress tracking uses the existing browser-local storage key. Read sections can be checked manually; revealing a printed answer or saving an open response records the item as complete. Checks can be undone. The unit list shows completion counts, and resume links restore the last section/question and scroll offset. This data stays in the current browser and does not sync between devices.

Practice contains 535 four-choice English cloze questions across 59 units. The learner selects the English word or expression that completes the textbook sentence. Each item has three authored distractors and a separate, supplemental English situation to distinguish the intended answer; this context is study material, not a transcription. The completed sentence, Korean meaning, printed English definition, and any correction note appear only after checking the answer. A few erroneous printed answer forms are corrected with explicit notes; a duplicated "your computer" is removed from the restart option only. Choices use deterministically shuffled, balanced answer positions. English selections have their own browser-local namespace so previous meaning-quiz selections cannot appear as new responses. Existing completion, typed drafts, history, and resume are retained. Comprehension, discussion, and free-response sections are unchanged.
