<script>
  import log from "loglevel";
  import Papa from "papaparse";
  import { roster } from "../lib/store.js";

  log.setLevel("debug");

  let loadingMessage = "";
  let confirmationMessage = "";

  // Process Classlist JSON.
  async function handleClasslistJson(file) {
    loadingMessage = "Loading classlist JSON...";
    log.debug("Processing JSON file:", file);
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      log.debug("Parsed JSON data:", data);
      log.debug("Found", data.length, "students in JSON.");
      roster.set(data);
      confirmationMessage = `Loaded ${data.length} students from JSON.`;
    } catch (err) {
      log.error("Error parsing JSON:", err);
      confirmationMessage = `Error loading JSON: ${err.message}`;
    } finally {
      loadingMessage = "";
    }
  }

  // Process GitHub CSV.
  async function handleGithubCsv(file) {
    loadingMessage = "Loading GitHub CSV...";
    log.debug("Processing GitHub CSV file:", file);
    if (!file) return;
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true });
    log.debug("Parsed GitHub CSV:", parsed);
    const rows = parsed.data;
    const githubMap = {};

    // Count updated records.
    let countUpdated = 0;

    for (const row of rows) {
      // Expect headers with trailing colons.
      const pennId = row["Your PennID:"] ? row["Your PennID:"].trim() : null;
      if (!pennId) continue;
      const timestampStr = row["Timestamp"] ? row["Timestamp"].trim() : "";
      const dateVal = new Date(timestampStr).valueOf() || 0;
      // Fix: define variable as githubUsername.
      const githubUsername = row["Your GitHub username:"]
        ? row["Your GitHub username:"].trim()
        : null;
      if (!githubMap[pennId] || dateVal > githubMap[pennId].dateVal) {
        githubMap[pennId] = { dateVal, githubUsername };
      }
    }
    log.debug("Built GitHub map:", githubMap);
    // Merge GitHub data into the roster.
    roster.update((currentRoster) => {
      return currentRoster.map((student) => {
        const matching = githubMap[student.studentId];
        if (
          matching &&
          matching.githubUsername &&
          student.githubUsername !== matching.githubUsername
        ) {
          countUpdated++;
          return { ...student, githubUsername: matching.githubUsername };
        }
        return student;
      });
    });
    confirmationMessage =
      countUpdated > 0
        ? `GitHub CSV processed: updated ${countUpdated} record${countUpdated === 1 ? "" : "s"}.`
        : "GitHub CSV processed: no changes made.";
    loadingMessage = "";
  }

  // Process Slack CSV.
  async function handleSlackCsv(file) {
    loadingMessage = "Loading Slack CSV...";
    log.debug("Processing Slack CSV file:", file);
    if (!file) return;
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true });
    log.debug("Parsed Slack CSV:", parsed);
    const rows = parsed.data;
    const slackMap = {};
    for (const row of rows) {
      if (!row.email) continue;
      const email = row.email.trim().toLowerCase();
      const userId = row.userid ? row.userid.trim() : null;
      const fullname = row.fullname ? row.fullname.trim() : null;
      const displayname = row.displayname ? row.displayname.trim() : null;
      slackMap[email] = { userId, fullname, displayname };
    }
    log.debug("Built Slack map:", slackMap);
    roster.update((currentRoster) => {
      return currentRoster.map((student) => {
        const stuEmail = student.EmailAddress
          ? student.EmailAddress.toLowerCase()
          : "";
        const match = slackMap[stuEmail];
        if (match) {
          return {
            ...student,
            slackUserId: match.userId,
            slackFullname: match.fullname,
            slackDisplayname: match.displayname,
          };
        }
        return student;
      });
    });
    confirmationMessage = "Slack CSV processed.";
    loadingMessage = "";
  }

  function onClasslistChange(event) {
    const file = event.target.files[0];
    log.info("File selected for Classlist:", file);
    handleClasslistJson(file);
    event.target.value = "";
  }

  function onGithubChange(event) {
    const file = event.target.files[0];
    log.info("File selected for GitHub CSV:", file);
    handleGithubCsv(file);
    event.target.value = "";
  }

  function onSlackChange(event) {
    const file = event.target.files[0];
    log.info("File selected for Slack CSV:", file);
    handleSlackCsv(file);
    event.target.value = "";
  }
</script>

<div class="upload-section">
  <h3>Upload Data</h3>
  <div>
    <label for="classlist">Classlist JSON:</label>
    <input
      id="classlist"
      type="file"
      accept=".json"
      on:change={onClasslistChange}
    />
  </div>
  <div>
    <label for="github">GitHub CSV:</label>
    <input id="github" type="file" accept=".csv" on:change={onGithubChange} />
  </div>
  <div>
    <label for="slack">Slack CSV:</label>
    <input id="slack" type="file" accept=".csv" on:change={onSlackChange} />
  </div>

  {#if loadingMessage}
    <div class="status loading">{loadingMessage}</div>
  {/if}
  {#if confirmationMessage}
    <div class="status confirmation">{confirmationMessage}</div>
  {/if}
</div>

<style>
  .upload-section {
    background: #eef6fc;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  .upload-section > div {
    margin-bottom: 0.75rem;
  }
  label {
    font-weight: bold;
    margin-right: 0.5rem;
  }
  input[type="file"] {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.25rem;
  }
  .status {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #333;
  }
  .loading {
    color: #007acc;
  }
  .confirmation {
    color: #28a745;
  }
</style>
