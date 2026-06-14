---
description: Search or save to janus memory
agent: build
---

Interact with janus memory.

The user wants to: $ARGUMENTS

Determine the action:
- If searching: call `memory_search` with the query. Present results with relevance.
- If saving: call `memory_save` with the content, type, and a suggested topic_key.
- If reviewing: call `memory_review` to list stale observations.
- If not specified: call `memory_context` for recent observations from previous sessions.

Present the results clearly.
