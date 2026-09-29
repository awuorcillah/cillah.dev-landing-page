# GitHub Issues & Workflow Guide for AI Agents

**Project**: `cillah.dev-landing-page`  
**Repository**: `https://github.com/awuorcillah/cillah.dev-landing-page.git`  
**Objective**: Maintain a rigorous, transparent, and up-to-date history of all work, decisions, and progress. Make sure you add datetime when creating and closing the issue.

---

## ⚠️ Prime Directive
**No code changes are committed without a corresponding GitHub Issue or Branch.** Taking 30 seconds to track work saves hours of confusion later.

---

## 1. Initialization (Start of Task)

Before writing any code or planning detailed implementation:

1. **Search & Check**: Look for existing issues related to the user's request. Record the current datetime in the issue body or as a comment if starting a new session on an existing issue.
2. **Create (if not found)**: Create a new issue if one does not exist.
3. **Update (if found)**: If an issue exists but is outdated, update it with new context and the current datetime.

### Issue Structure Template
When creating an issue, use this structure:

* **Title**: `[Type] Concise Description`  
  *Types*: `Feature`, `Bug`, `Refactor`, `Docs`, `Chore`

* **Body**:
  ```markdown
  **Start Datetime**: [ISO Timestamp]

  ## Objective
  [Brief description of what needs to be achieved]

  ## Acceptance Criteria
  - [ ] Criterion 1 (e.g., Auth & Login page configured)
  - [ ] Criterion 2 (e.g., Role-based access control for admin/user)

  ## Technical Notes
  - [Optional: Strategy notes, e.g., using Supabase Auth & Next.js Middleware]
  ```

---

## 2. Execution (During Work)

* **Branching**: Specific branches should be created for each issue/feature.
  * **Naming Convention**: `feat/ISSUE-ID-short-description` or `fix/ISSUE-ID-short-description` (e.g., `feat/auth-login-roles`)
* **Commits**: All commit messages must reference the issue ID or feature context.
  * **Format**: `[#ISSUE_ID] Commit message` (e.g., `[Auth] Set up Supabase login roles`)

---

## 3. Completion (End of Task)

1. **Verification**: Ensure all Acceptance Criteria are met.
2. **Closing**: Close the issue on GitHub.
3. **Completion Record**: Update the issue body or add a comment with the final resolution and finishing time.

---

## 4. Standard Labels
Apply standard labels when creating issues (`enhancement`, `bug`, `documentation`, `auth`).
