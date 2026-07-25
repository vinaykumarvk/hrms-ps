/goal
  objective: <one sentence: the outcome this phase must deliver, from the plan's phase goal/output>
  context:
    - <plan file, contracts, prior-phase evidence, source files the phase reads>
  constraints:
    - <what must not be violated: don't touch X, keep tests green, characterization only, no destructive DB ops, etc.>
    - Every artifact/claim cites path:line or a command output. No prose-only "done".
  freedom:
    - <where the agent may choose the route>
  work_loops:
    - name: <loop 1>
      max_iterations: <n>            # always bound the loop
      repeat_until: <a checkable completion condition — ideally the same thing the exit_criteria verifies>
      steps: [<step>, <step>, <step>]
    - name: Review-repair
      max_iterations: 3
      repeat_until: A completeness critic finds nothing unverified/assumed/missing.
      steps: [review evidence, run completeness critic, fix gaps, re-run checks]
  evidence_required:
    - <artifact 1>                   # these must satisfy the phase's checks/<phase>.sh
    - <artifact 2>
    - <update the pipeline/runtime manifest with this phase's verdict>
  escalate_when:
    - <hard-stop conditions: ambiguity after one attempt; destructive change needed; exit-criteria unreachable>
